import { ChevronDown, Globe } from "lucide-react";
import { hotelConfig } from "@/config/hotel.config";
import { langMeta, LANGS, type Lang } from "@/lib/locales/meta";
import { cn } from "@/lib/utils";

/**
 * The language menu · sixteen languages, zero JavaScript (ported from the v16
 * LanguageMenu, restyled to the Teak House header).
 *
 * A native <details> holds the list; every entry is a plain link to
 * `?lang=xx`, which the middleware promotes into the locale cookie and serves
 * in that language. A full navigation on purpose: the page's fonts, direction
 * and every string change together. HeaderSync (when scripts run) keeps the
 * current query string on these links, closes the menu on an outside click or
 * Escape, and closes it on navigation.
 *
 * `variant="drawer"` opens the list in the flow of the phone menu instead of
 * as a floating panel, so nothing is clipped by the drawer's scroll area.
 */
export function LanguageMenu({
  current,
  label,
  variant = "header",
}: {
  current: Lang;
  label: string;
  variant?: "header" | "drawer";
}) {
  const meta = langMeta(current);
  const offered = LANGS.filter((l) => hotelConfig.languages.includes(l.code));
  const drawer = variant === "drawer";

  return (
    <details className={cn("tkh-lang group/lang shrink-0", drawer ? "open:w-full" : "relative")}>
      <summary
        className={cn(
          "icon-hit inline-flex cursor-pointer list-none items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 font-semibold uppercase tracking-[0.06em] text-ink [&::-webkit-details-marker]:hidden",
          drawer ? "text-[15px]" : "text-[13px]"
        )}
        aria-label={`${label}: ${meta.native}`}
      >
        <Globe className="h-4 w-4 shrink-0 text-sub" strokeWidth={1.75} aria-hidden />
        <span>{current}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-sub transition group-open/lang:rotate-180"
          aria-hidden
        />
      </summary>
      <ul
        className={cn(
          "grid grid-cols-2 gap-0.5 bg-white",
          drawer
            ? "mt-2 w-full pb-1"
            : "tkh-menu-pop absolute top-full z-modal mt-3 w-[min(92vw,420px)] rounded-card border border-line/70 p-2 shadow-float end-0"
        )}
      >
        {offered.map((l) => (
          <li key={l.code}>
            <a
              href={`?lang=${l.code}`}
              hrefLang={l.tag}
              lang={l.tag}
              dir={l.dir}
              data-lang-link={l.code}
              aria-current={l.code === current ? "true" : undefined}
              className={cn(
                "flex min-h-[40px] items-center justify-between gap-3 rounded-soft px-3 py-2 text-[14px] font-medium transition hover:bg-ivory",
                l.code === current ? "bg-ivory text-ink" : "text-ink"
              )}
            >
              <span>{l.native}</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sub">
                {l.code}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
