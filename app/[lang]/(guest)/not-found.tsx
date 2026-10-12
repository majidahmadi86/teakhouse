import { LANG_CODES } from "@/lib/locales/meta";
import { t } from "@/lib/serverLocale";
import { NotFoundCopy, type NotFoundStrings } from "./NotFoundCopy";

/**
 * The guest 404 for notFound() inside a guest page (an unknown room, a stay
 * /book cannot read) · inside the guest frame, so it still looks like the
 * hotel. An address no route matches at all (/journey) never reaches this:
 * Next answers it with its static /_not-found page.
 *
 * Without this boundary the client had nothing to catch notFound() with:
 * Next 14 answers an in-page notFound() with its bare error document
 * (<html id="__next_error__">) and builds the page in the browser, which then
 * threw "Only one element on document allowed" and a removeChild
 * NotFoundError while mounting the real root layout's <html>.
 *
 * Next 14 never server-renders this boundary (that arrives in Next 15), so a
 * not-found file receives no params and the language comes from the route in
 * the browser: the copy for each language travels as a few short strings and
 * NotFoundCopy picks one with useParams().
 */
export default function GuestNotFound() {
  const copy = Object.fromEntries(
    LANG_CODES.map((lang) => [
      lang,
      {
        eyebrow: t(lang, "nf.eyebrow"),
        title: t(lang, "nf.title"),
        lead: t(lang, "nf.lead"),
        home: t(lang, "nf.home"),
        rooms: t(lang, "nav.megaAll"),
      },
    ])
  ) as Record<string, NotFoundStrings>;

  return <NotFoundCopy copy={copy} />;
}
