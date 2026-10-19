import type { Room } from "./rooms";

/**
 * v18 · Room writes are checked on the server as well as in the form, so a
 * room can never be saved without a name, with a malformed address or with
 * a rate of zero.
 */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type RoomInvalid = { error: string; field: string; message: string };

/** A full room (create) · every field that matters must be present. */
export function validateRoomCreate(room: Partial<Room>): RoomInvalid | null {
  if (!room.name?.en?.trim()) {
    return { error: "invalid", field: "name", message: "The room needs an English name." };
  }
  if (!room.slug || !SLUG_RE.test(room.slug)) {
    return { error: "invalid", field: "slug", message: "The web address may use a-z, 0-9 and hyphens only." };
  }
  return validateRoomPatch(room);
}

/** A partial room (update) · only the fields that are sent are checked. */
export function validateRoomPatch(patch: Partial<Room>): RoomInvalid | null {
  if (patch.name !== undefined && !patch.name?.en?.trim()) {
    return { error: "invalid", field: "name", message: "The room needs an English name." };
  }
  if (patch.slug !== undefined && !SLUG_RE.test(String(patch.slug))) {
    return { error: "invalid", field: "slug", message: "The web address may use a-z, 0-9 and hyphens only." };
  }
  if (patch.rate !== undefined && !(Number.isFinite(patch.rate) && patch.rate > 0)) {
    return { error: "invalid", field: "rate", message: "The direct rate must be more than zero." };
  }
  if (patch.ota !== undefined && !(Number.isFinite(patch.ota) && patch.ota >= 0)) {
    return { error: "invalid", field: "ota", message: "The OTA rate cannot be negative." };
  }
  if (patch.capacity !== undefined && !(Number.isInteger(patch.capacity) && patch.capacity >= 1)) {
    return { error: "invalid", field: "capacity", message: "A room sleeps at least one guest." };
  }
  return null;
}
