import { FONT_SETS } from "./fonts.generated";
import type { Lang } from "./locales/meta";

/**
 * Teak House typography per language (A1: at most 2 families and 3 preloaded
 * files on any route, subset, fallback metrics so the swap moves nothing).
 *
 * Every language loads exactly ONE pair, display + text, self-hosted and
 * subset by Google's unicode ranges (scripts/fonts/build-fonts.mjs writes
 * lib/fonts.generated.ts and public/fonts/**, content-hashed and cached for a
 * year):
 *
 *   latin       Marcellus + Plus Jakarta Sans     en de fr es it pt id ms
 *   vi          Spectral + Plus Jakarta Sans      vi (Marcellus has no Vietnamese)
 *   cyrillic    Forum + Manrope                   ru (neither house face has Cyrillic)
 *   thai        Kanit + Sarabun                   th
 *   arabic      Noto Kufi Arabic + Noto Sans Arabic       ar
 *   devanagari  Noto Serif + Noto Sans Devanagari         hi
 *   sc jp kr    Noto Serif + Noto Sans SC / JP / KR       zh ja ko
 *
 * Each face has a "Fallback" twin on a local system font with
 * ascent/descent/line-gap overrides and size-adjust (the adjustFontFallback
 * computation), and the house's CSS variables (--font-marcellus,
 * --font-jakarta, --font-kanit, --font-sarabun) all point at the active pair,
 * so no element on a page can pull in a third family. A page preloads two
 * files of its pair (the subset its first paint needs); the CJK sets preload
 * nothing (their slices are chosen by the text) and load their large
 * @font-face table as a stylesheet that never blocks the first paint.
 */

export type FontSetName = keyof typeof FONT_SETS;

const BY_LANG: Record<Lang, FontSetName> = {
  en: "latin",
  de: "latin",
  fr: "latin",
  es: "latin",
  it: "latin",
  pt: "latin",
  id: "latin",
  ms: "latin",
  vi: "vi",
  ru: "cyrillic",
  th: "thai",
  ar: "arabic",
  hi: "devanagari",
  zh: "sc",
  ja: "jp",
  ko: "kr",
};

export function fontSetName(lang: Lang): FontSetName {
  return BY_LANG[lang] ?? "latin";
}

/** Load the external stylesheet without blocking paint, then apply it. */
const APPLY_JS =
  "(function(){var l=document.querySelector('link[data-tkh-fonts]');if(!l)return;function a(){l.media='all'}if(l.sheet)a();else l.addEventListener('load',a)})();";

/** The <head> part of the typography for one language. */
export function FontHead({ lang }: { lang: Lang }) {
  const set = FONT_SETS[fontSetName(lang)];
  const href = "cssHref" in set ? (set.cssHref as string | null) : null;
  return (
    <>
      {set.preloads.map((file) => (
        <link
          key={file}
          rel="preload"
          as="font"
          type="font/woff2"
          href={file}
          crossOrigin="anonymous"
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `${set.vars}\n${set.css}` }} />
      {href ? (
        <>
          <link rel="stylesheet" href={href} media="print" data-tkh-fonts="" />
          <script dangerouslySetInnerHTML={{ __html: APPLY_JS }} />
          <noscript>
            <link rel="stylesheet" href={href} />
          </noscript>
        </>
      ) : null}
    </>
  );
}
