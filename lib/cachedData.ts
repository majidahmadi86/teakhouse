import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { diningCategoryToClient, type DiningCategory } from "@/lib/dining";
import { hotelEventToClient, type HotelEvent } from "@/lib/events";
import {
  RESERVATION_DEFAULTS,
  type ReservationSettings,
} from "@/lib/reservations";

/**
 * v14 · Cached reads for the guest pages.
 *
 * The pages themselves stay dynamic on purpose: the UI language comes from the
 * `tkh-lang` cookie, and reading a cookie opts a route out of static rendering.
 * What was actually costing the time was the database round trip on every
 * request (Supabase sits a long way from the Vercel region · /dining measured
 * 1.7s warm TTFB). So the DATA is cached and tagged instead, which takes the
 * query off the request path without touching how locale works.
 *
 * Freshness comes from tags, not from a short window: every owner mutation
 * calls revalidateTag, so a demo edit shows up on the next request. The long
 * revalidate is only a backstop for writes that bypass the API (a direct SQL
 * edit, say).
 */

export const TAG_DINING = "dining";
export const TAG_EVENTS = "events";
export const TAG_HOTEL = "hotel";
export const TAG_ROOMS = "rooms";

const HOUR = 3600;

/** Published menu with published dishes · exactly the fields the page renders. */
export const getPublishedMenu = unstable_cache(
  async (): Promise<DiningCategory[]> => {
    const rows = await prisma.diningCategory.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        nameEn: true,
        nameTh: true,
        image: true,
        order: true,
        published: true,
        items: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            categoryId: true,
            nameEn: true,
            nameTh: true,
            descriptionEn: true,
            descriptionTh: true,
            price: true,
            image: true,
            order: true,
            published: true,
          },
        },
      },
    });
    return rows.map(diningCategoryToClient).filter((c) => c.items.length > 0);
  },
  ["published-menu"],
  { tags: [TAG_DINING], revalidate: HOUR }
);

/** Published events from `todayIso` onward · the key includes the date so a
 *  rollover past midnight cannot serve yesterday's list. */
export const getUpcomingEvents = unstable_cache(
  async (todayIso: string): Promise<HotelEvent[]> => {
    const rows = await prisma.hotelEvent.findMany({
      where: { published: true, date: { gte: todayIso } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        titleEn: true,
        titleTh: true,
        date: true,
        descriptionEn: true,
        descriptionTh: true,
        image: true,
        published: true,
      },
    });
    return rows.map(hotelEventToClient);
  },
  ["upcoming-events"],
  { tags: [TAG_EVENTS], revalidate: HOUR }
);

export type CachedHotelSettings = ReservationSettings & {
  diningHeroImage: string;
  eventsHeroImage: string;
};

const SETTINGS_FALLBACK: CachedHotelSettings = {
  ...RESERVATION_DEFAULTS,
  reservationsEnabled: false,
  diningHeroImage: "",
  eventsHeroImage: "",
};

/** The cached read itself · wrapped by getHotelSettings below. */
const readHotelSettings = unstable_cache(
  async (): Promise<CachedHotelSettings> => {
    const row = await prisma.hotel.findUnique({
      where: { id: "default" },
      select: {
        reservationsEnabled: true,
        serviceStart: true,
        serviceEnd: true,
        maxPartySize: true,
        diningHeroImage: true,
        eventsHeroImage: true,
      },
    });
    // THROW rather than return the fallback · see getHotelSettings below. A
    // throw inside unstable_cache is not cached, which is the whole point.
    if (!row) throw new Error("hotel row missing");
    return row;
  },
  ["hotel-settings"],
  { tags: [TAG_HOTEL], revalidate: HOUR }
);

/**
 * The house settings a guest page needs · one row, one round trip, shared by
 * the reservation window and the page hero overrides so a page never asks
 * twice.
 *
 * The fallback means reservations OFF, because offering a form we cannot honour
 * is worse than hiding it. The critical part is that the fallback is NEVER
 * CACHED.
 *
 * This caused a real guest-facing outage. The fallback used to be returned from
 * inside unstable_cache, so any moment the row was unreadable · every reseed
 * deletes and recreates it, and a cold Supabase connection can throw · wrote
 * "reservations are closed" into the data cache under a one-hour revalidate.
 * From then on /dining/reserve served the closed screen to every guest while
 * the owner's switch, which reads the live row uncached, still said "Taking
 * bookings". Nothing in the product was wrong and nothing recovered it: the
 * reseed's revalidateAll() had already run before the poisoned entry was
 * written, so the two disagreed until the hour expired.
 *
 * Keeping the throw inside the cached function and the fallback outside it
 * means a bad read costs one request, not an hour.
 */
export async function getHotelSettings(): Promise<CachedHotelSettings> {
  try {
    return await readHotelSettings();
  } catch (e) {
    console.error("[cachedData] hotel settings · serving uncached fallback", e);
    return SETTINGS_FALLBACK;
  }
}
