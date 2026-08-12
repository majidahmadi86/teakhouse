import { SEED_ROOMS } from "@/lib/rooms";

/**
 * Seed rooms for guest chrome · no OwnerStore import.
 *
 * Filtered once at module load, not per call. Callers use this as a React
 * dependency, and returning a fresh array every time made every consumer
 * re-run its effects on every render.
 */
const SEED_GUEST_ROOMS = SEED_ROOMS.filter((r) => r.active);

export function getSeedGuestRooms() {
  return SEED_GUEST_ROOMS;
}
