import { revalidateTag } from "next/cache";
import { TAG_CONTENT } from "@/lib/content/localize";
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

/** Database copy in the fourteen languages beyond EN/TH (lib/content). */
export function revalidateContent() {
  revalidateTag(TAG_CONTENT);
}

/** The hourly demo reseed rewrites everything · drop the lot. */
export function revalidateAll() {
  revalidateContent();
  revalidateDining();
  revalidateEvents();
  revalidateHotel();
  revalidateRooms();
}
