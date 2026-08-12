import { revalidateTag } from "next/cache";
import {
  TAG_DINING,
  TAG_EVENTS,
  TAG_HOTEL,
  TAG_ROOMS,
} from "@/lib/cachedData";

/**
 * v14 · One place that knows which owner action invalidates which guest page.
 *
 * Every owner mutation calls one of these, so a demo edit is visible on the
 * next guest request rather than whenever a timer happens to expire. Kept as
 * named helpers rather than raw revalidateTag calls so a new tag cannot be
 * added in one route and forgotten in another.
 */

export function revalidateDining() {
  revalidateTag(TAG_DINING);
}

export function revalidateEvents() {
  revalidateTag(TAG_EVENTS);
}

export function revalidateHotel() {
  revalidateTag(TAG_HOTEL);
}

export function revalidateRooms() {
  revalidateTag(TAG_ROOMS);
}

/** The hourly demo reseed rewrites everything · drop the lot. */
export function revalidateAll() {
  revalidateDining();
  revalidateEvents();
  revalidateHotel();
  revalidateRooms();
}
