import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/lib/locales/meta";

/**
 * Guest pages live under the internal locale segment app/[lang]/... (the
 * middleware rewrites every public URL there). This is how a page, a layout or
 * generateMetadata reads its language: from the route, never from the request
 * (cookies() or headers() would make the page dynamic).
 */
export type LangParams = { lang: string };

export function pageLang(params: LangParams): Lang {
  if (!isLang(params.lang)) notFound();
  return params.lang;
}

/**
 * generateStaticParams for the locale segment · English and Thai are
 * prerendered at build time; the other languages render on a page's first
 * visit in that language and are cached from then on (dynamicParams stays on,
 * pageLang() still 404s anything that is not a language). Building every
 * language made each deployment ~100 MB of pages against the team's 10 GB
 * deployment storage.
 */
const PRERENDERED: Lang[] = ["en", "th"];

export function langStaticParams(): LangParams[] {
  return PRERENDERED.map((lang) => ({ lang }));
}
