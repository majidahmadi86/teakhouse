/**
 * v13 · Server-side reads of the owner-editable house settings that guest
 * pages need: the reservation window and the uploaded page heroes. Kept apart
 * from lib/dataService so a guest page pulls one small row, not the whole
 * owner payload.
 */
import { prisma } from "@/lib/db";
import {
  RESERVATION_DEFAULTS,
  type ReservationSettings,
} from "@/lib/reservations";

export type PageMedia = {
  diningHeroImage: string;
  eventsHeroImage: string;
};

const MEDIA_DEFAULTS: PageMedia = { diningHeroImage: "", eventsHeroImage: "" };

/**
 * Reservation settings for the guest side. A missing hotel row (fresh database,
 * mid-reseed) falls back to the defaults with reservations OFF · showing a
 * booking form we cannot honour is worse than hiding it.
 */
export async function getReservationSettings(): Promise<ReservationSettings> {
  try {
    const row = await prisma.hotel.findUnique({
      where: { id: "default" },
      select: {
        reservationsEnabled: true,
        serviceStart: true,
        serviceEnd: true,
        maxPartySize: true,
      },
    });
    if (!row) return { ...RESERVATION_DEFAULTS, reservationsEnabled: false };
    return row;
  } catch (e) {
    console.error("[hotelSettings] reservation settings", e);
    return { ...RESERVATION_DEFAULTS, reservationsEnabled: false };
  }
}

/** Uploaded hero overrides · empty string means "use the seeded local image". */
export async function getPageMedia(): Promise<PageMedia> {
  try {
    const row = await prisma.hotel.findUnique({
      where: { id: "default" },
      select: { diningHeroImage: true, eventsHeroImage: true },
    });
    return row ?? MEDIA_DEFAULTS;
  } catch (e) {
    console.error("[hotelSettings] page media", e);
    return MEDIA_DEFAULTS;
  }
}
