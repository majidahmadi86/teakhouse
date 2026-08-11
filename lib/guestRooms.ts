import { SEED_ROOMS } from "@/lib/rooms";

/** Seed rooms for guest chrome · no OwnerStore import. */
export function getSeedGuestRooms() {
  return SEED_ROOMS.filter((r) => r.active);
}
