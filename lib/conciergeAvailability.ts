/**
 * Turns a live availability read into something the concierge can say.
 *
 * Two outputs, one source of truth:
 *  · `availabilityFacts` · a plain block injected into the AI system prompt,
 *    so the model phrases real numbers instead of inventing them.
 *  · `composeAvailabilityReply` · a complete deterministic answer used when the
 *    AI is not configured, times out, or errors. The guest still gets rooms,
 *    nightly prices, a total, and a booking link with the dates prefilled.
 *
 * Every guest-facing string comes from the dictionary · no copy lives here.
 */

import type { AvailabilityResult, RoomAvailability } from "./availability";
import { formatThb, translate, type Lang } from "./translate";

const MAX_ROOMS_IN_REPLY = 4;

function roomName(room: RoomAvailability, lang: Lang): string {
  return lang === "th" ? room.nameTh : room.nameEn;
}

/** "฿2,100" for a flat stay · "฿2,100 to ฿2,415" when nights differ. */
function nightlyLabel(room: RoomAvailability, lang: Lang): string {
  if (!room.mixed) return formatThb(room.minNight);
  return translate(lang, "cg.av.nightlyRange", {
    lo: formatThb(room.minNight),
    hi: formatThb(room.maxNight),
  });
}

/** Booking handoff with the asked dates already filled in. */
export function bookHref(result: AvailabilityResult, roomSlug?: string): string {
  const params = new URLSearchParams({
    in: result.checkIn,
    out: result.checkOut,
  });
  if (roomSlug) params.set("room", roomSlug);
  return `/book?${params.toString()}`;
}

/**
 * The link the guest should actually be sent to: the dates they asked for when
 * those are bookable, the nearest free window when they are not, and the plain
 * booking page when we know of nothing.
 */
export function handoffHref(result: AvailabilityResult | null): string {
  if (!result) return "/book";
  if (result.anyAvailable) return bookHref(result);
  const alt = result.alternatives[0];
  if (!alt) return "/book";
  return bookHref({ ...result, checkIn: alt.checkIn, checkOut: alt.checkOut });
}

/**
 * FACTS for the AI prompt. Deliberately flat and boring · the model's job is
 * to phrase it, not to compute it.
 */
export function availabilityFacts(result: AvailabilityResult): string {
  const header = `Dates asked: ${result.checkIn} to ${result.checkOut} (${result.nights} nights).`;

  if (result.free.length === 0) {
    const alts = result.alternatives.length
      ? result.alternatives
          .map(
            (a) =>
              `${a.checkIn} to ${a.checkOut} (${a.freeRooms} room types free, from ฿${a.cheapestTotal.toLocaleString("en-US")} total)`
          )
          .join("; ")
      : "none within a week either side";
    const first = result.alternatives[0];
    return [
      header,
      "NOTHING is available for those dates. Do not offer any room for them.",
      `Nearest alternatives: ${alts}.`,
      first
        ? `Booking link for the nearest alternative: ${bookHref({ ...result, checkIn: first.checkIn, checkOut: first.checkOut })}`
        : "Do not give a booking link for the asked dates · offer to look at other dates instead.",
    ].join("\n");
  }

  const lines = result.free.map((room) => {
    const nightly = room.mixed
      ? `฿${room.minNight.toLocaleString("en-US")} to ฿${room.maxNight.toLocaleString("en-US")} per night (rates differ by date)`
      : `฿${room.minNight.toLocaleString("en-US")} per night`;
    return `${room.nameEn}: AVAILABLE, ${nightly}, ฿${room.total.toLocaleString("en-US")} total for the stay, sleeps ${room.capacity}`;
  });

  const unavailable = result.rooms
    .filter((r) => !r.available)
    .map((r) => `${r.nameEn} (${r.reason})`);

  return [
    header,
    "Available room types and their real prices for exactly these dates:",
    ...lines,
    unavailable.length ? `Not available: ${unavailable.join(", ")}.` : "",
    `Booking link with these dates prefilled: ${bookHref(result)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** A complete, correct answer with no model in the loop. */
export function composeAvailabilityReply(
  result: AvailabilityResult,
  lang: Lang
): string {
  const head = translate(lang, "cg.av.head", {
    in: result.checkIn,
    out: result.checkOut,
    n: result.nights,
    // Reuses the existing bk.night / bk.nights strings · Thai is "คืน" for both.
    unit: translate(lang, result.nights === 1 ? "bk.night" : "bk.nights"),
  });

  const link = `<a href="${bookHref(result)}" class="font-extrabold text-blue">${translate(lang, "cg.av.book")}</a>`;

  if (result.free.length === 0) {
    const none = translate(lang, "cg.av.none");
    const alt = result.alternatives[0];
    if (!alt) {
      return `${head} ${none} ${translate(lang, "cg.av.noAlt")} ${link}`;
    }
    // Hand off to the dates that are actually bookable, not the ones that are not.
    const altLink = `<a href="${bookHref({ ...result, checkIn: alt.checkIn, checkOut: alt.checkOut })}" class="font-extrabold text-blue">${translate(lang, "cg.av.book")}</a>`;
    const tail = translate(lang, "cg.av.alt", {
      in: alt.checkIn,
      out: alt.checkOut,
      total: formatThb(alt.cheapestTotal),
    });
    return `${head} ${none} ${tail} ${altLink}`;
  }

  const rooms = result.free
    .slice(0, MAX_ROOMS_IN_REPLY)
    .map((room) =>
      translate(lang, "cg.av.room", {
        room: roomName(room, lang),
        nightly: nightlyLabel(room, lang),
        total: formatThb(room.total),
      })
    )
    .join(" · ");

  const mixedNote = result.free.some((r) => r.mixed)
    ? ` ${translate(lang, "cg.av.mixed")}`
    : "";

  return `${head} ${translate(lang, "cg.av.free")} ${rooms}.${mixedNote} ${link}`;
}

/** Said when the availability read itself failed · never a guess. */
export function availabilityUnknownReply(lang: Lang): string {
  const link = `<a href="/book" class="font-extrabold text-blue">${translate(lang, "cg.av.book")}</a>`;
  return `${translate(lang, "cg.av.checking")} ${link}`;
}
