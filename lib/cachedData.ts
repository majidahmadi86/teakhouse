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

/**
 * The house settings a guest page needs · one row, one round trip, shared by
 * the reservation window and the page hero overrides so a page never asks
 * twice. A missing row means reservations OFF: offering a form we cannot
 * honour is worse than hiding it.
 */
export const getHotelSettings = unstable_cache(
  async (): Promise<CachedHotelSettings> => {
    try {
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
      return row ?? SETTINGS_FALLBACK;
    } catch (e) {
      console.error("[cachedData] hotel settings", e);
      return SETTINGS_FALLBACK;
    }
  },
  ["hotel-settings"],
  { tags: [TAG_HOTEL], revalidate: HOUR }
);
