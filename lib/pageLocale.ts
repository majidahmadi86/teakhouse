import { notFound } from "next/navigation";
import { isLang, LANG_CODES, type Lang } from "@/lib/locales/meta";

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

/** generateStaticParams for the locale segment · every language, prerendered. */
export function langStaticParams(): LangParams[] {
  return LANG_CODES.map((lang) => ({ lang }));
}
