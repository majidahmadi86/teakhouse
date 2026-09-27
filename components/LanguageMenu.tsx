import { ChevronDown, Globe } from "lucide-react";
import { LANGS, type Lang } from "@/lib/locales";
import { cn } from "@/lib/utils";

/**
 * v15 · The language menu · sixteen languages, zero JavaScript.
 *
 * A native <details> holds the list; every entry is a plain link to
 * `?lang=xx`, which the middleware promotes into the locale cookie before the
 * page renders. It therefore works identically in the zero-JS HeaderShell and
 * the hydrated Header (VISUAL PARITY LAW · same component, same markup), in
 * the mobile drawer, and with scripting disabled.
 */
export function LanguageMenu({
  current,
  className,
  align = "end",
}: {
  current: Lang;
  className?: string;
  align?: "start" | "end";
}) {
  return (
    <details className={cn("tkh-lang group relative shrink-0", className)}>
      <summary
        className="icon-hit inline-flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-ink [&::-webkit-details-marker]:hidden"
        aria-label="Language"
      >
        <Globe className="h-4 w-4 shrink-0 text-sub" strokeWidth={1.75} aria-hidden />
        <span>{current}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sub transition group-open:rotate-180" aria-hidden />
      </summary>
      <ul
        className={cn(
          "absolute top-full z-modal mt-2 grid w-[min(92vw,440px)] grid-cols-2 gap-0.5 rounded-[6px] border border-line bg-white p-2 shadow-[0_18px_50px_rgba(28,24,20,.14)]",
          align === "end" ? "right-0" : "left-0"
        )}
      >
        {LANGS.map((l) => (
          <li key={l.code}>
            <a
              href={`?lang=${l.code}`}
              hrefLang={l.tag}
              lang={l.tag}
              dir={l.dir}
              className={cn(
                "flex min-h-[40px] items-center justify-between gap-3 rounded-[4px] px-3 py-2 text-[13px] font-semibold transition hover:bg-cloud",
                l.code === current ? "bg-cloud text-blue" : "text-ink"
              )}
              aria-current={l.code === current ? "true" : undefined}
            >
              <span>{l.native}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-strike">{l.code}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
