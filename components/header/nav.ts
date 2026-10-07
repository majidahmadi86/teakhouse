/**
 * The guest navigation, in one place · read by the server header, its phone
 * drawer, the active-state CSS (app/globals.css, "Active navigation") and
 * HeaderSync (aria-current).
 *
 * `id` is the section a page declares with <NavMark section="..." />; the
 * header marks the matching item active in CSS, so the static HTML shows the
 * right item with no request-time pathname and no hydration swap.
 */

export type NavSection =
  | "rooms"
  | "dining"
  | "events"
  | "experience"
  | "facilities"
  | "gallery"
  | "location"
  | "contact"
  | "offers"
  | "book"
  | "account";

/** Rooms · Dining · Events · Experience (dropdown) · Location · Contact. */
export const NAV_LEAD = [
  { href: "/dining", id: "dining", key: "nav.dining" },
  { href: "/events", id: "events", key: "nav.eventsShort" },
] as const;

export const NAV_TAIL = [
  { href: "/location", id: "location", key: "nav.location" },
  { href: "/contact", id: "contact", key: "nav.contact" },
] as const;

/** Grouped under the Experience dropdown. */
export const EXPERIENCE_GROUP = [
  { href: "/experience", id: "experience", key: "nav.experience" },
  { href: "/facilities", id: "facilities", key: "nav.facilities" },
  { href: "/gallery", id: "gallery", key: "nav.gallery" },
] as const;

/* The drawer is a short list · Experience, Facilities and Gallery live inside
   one expandable group so the whole thing fits at 390x844 without scrolling.
   Offers keeps its own row because it is a commercial entry point. */
export const DRAWER_NAV = [
  { href: "/rooms", id: "rooms", key: "nav.rooms", subtitle: "nav.roomsCount" },
  { href: "/dining", id: "dining", key: "nav.dining" },
  { href: "/events", id: "events", key: "nav.eventsShort" },
  { href: "/location", id: "location", key: "nav.location" },
  { href: "/contact", id: "contact", key: "nav.contact" },
  { href: "/offers", id: "offers", key: "nav.offers", offers: true },
] as const;

/** Which top-level item a section lights up (the group lights Experience). */
export function navGroupOf(section: NavSection): NavSection {
  return section === "facilities" || section === "gallery" ? "experience" : section;
}

/** Path → section, for HeaderSync's aria-current after client navigation. */
export function sectionOfPath(pathname: string): NavSection | null {
  const first = pathname.split("/")[1] ?? "";
  const known: NavSection[] = [
    "rooms",
    "dining",
    "events",
    "experience",
    "facilities",
    "gallery",
    "location",
    "contact",
    "offers",
    "book",
    "account",
  ];
  return (known as string[]).includes(first) ? (first as NavSection) : null;
}
