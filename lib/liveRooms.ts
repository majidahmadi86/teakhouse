import { ROOM_CATALOGUE, type CatalogueRoom } from "./rooms";

/**
 * The rooms a guest can book · the catalogue's content with the database's
 * live operating values laid over it, matched BY SLUG.
 *
 * - content (names, words, photographs, beds, sizes) always comes from the
 *   catalogue (lib/rooms.ts), so no database, old or new, can put an old room
 *   or an old photograph in front of a guest;
 * - `rate`, `ota` and `active` come from the database row with the same slug
 *   when there is one; otherwise the catalogue's base rate stands (a preview
 *   whose read-only database still holds the previous rooms prices from the
 *   catalogue and never crashes);
 * - `id` is the database id when the slug is known (rate rules are keyed by
 *   it), and the slug otherwise, which matches no rule, so the base rate is
 *   used for every night.
 *
 * Database rows whose slug is not in the catalogue are ignored.
 */

export type LiveRoomRow = {
  id: string;
  slug: string;
  rate: number;
  ota: number;
  active: boolean;
};

export type BookableRoom = CatalogueRoom & {
  /** The database id (rate rules are keyed by it) or the slug. */
  id: string;
  active: boolean;
  /** True when the database knows this room type. */
  live: boolean;
};

export function bookableRooms(rows: readonly LiveRoomRow[] | null | undefined): BookableRoom[] {
  const bySlug = new Map((rows ?? []).map((r) => [r.slug, r]));
  return ROOM_CATALOGUE.map((room) => {
    const row = bySlug.get(room.slug);
    if (!row) return { ...room, id: room.slug, active: true, live: false };
    return {
      ...room,
      id: row.id,
      rate: row.rate > 0 ? row.rate : room.rate,
      ota: row.ota > 0 ? row.ota : room.ota,
      active: row.active,
      live: true,
    };
  }).filter((r) => r.active);
}
