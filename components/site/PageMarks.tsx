import type { NavSection } from "@/components/header/nav";

/**
 * Page markers · how a page tells the shared server chrome about itself
 * without the chrome reading the request (which would make every guest page
 * dynamic) and without a client hook that renders differently on the server
 * and in the browser.
 *
 * Each is an empty, hidden element. app/globals.css reads them with :has():
 *   NavMark     lights the matching header and drawer item ("Active navigation")
 *   ChromeMark  turns off the phone Book bar or the footer, or flattens <main>,
 *               on the pages that carry their own (/book, room pages, sign-in)
 * HeaderSync mirrors NavMark into aria-current once scripts run.
 */
export function NavMark({ section }: { section: NavSection }) {
  return <span hidden data-nav-mark={section} />;
}

export function ChromeMark({
  noBookBar,
  noFooter,
  flushMain,
  whiteMain,
}: {
  /** The page has its own booking bar (or is a booking flow). */
  noBookBar?: boolean;
  /** Sign-in and sign-up are a focused task with no footer. */
  noFooter?: boolean;
  /** No bottom padding reserved for the phone Book bar. */
  flushMain?: boolean;
  /** White page ground instead of cloud (room pages). */
  whiteMain?: boolean;
}) {
  const tokens = [
    noBookBar && "no-bookbar",
    noFooter && "no-footer",
    flushMain && "flush-main",
    whiteMain && "white-main",
  ]
    .filter(Boolean)
    .join(" ");
  return <span hidden data-chrome={tokens} />;
}
