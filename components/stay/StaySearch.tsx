import { ArrowRight, CalendarDays, User } from "lucide-react";
import { Price } from "@/components/Price";
import { intlTag } from "@/lib/i18n-core";
import { MAX_GUESTS } from "@/lib/stayDate";
import { STAY_FORM_JS } from "@/lib/staySearchScript";
import { t } from "@/lib/serverLocale";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/locales/meta";

type Variant = "hero" | "bar" | "rail";

/**
 * StaySearch · the booking bar, a REAL form: GET /book?in&out&g[&room].
 *
 * Server HTML with no hydration of its own. Its behaviour (default dates on
 * the hotel's clock, the labels in the page language, check-out after
 * check-in, the native picker on click) is the small classic script in
 * lib/staySearchScript.ts. With scripting off the native date inputs show
 * themselves (the <noscript> style in the root layout), so what the guest sees
 * is always what the form submits.
 *
 *   hero  the home hero's pill (the v14 look: phone pill, desktop pill)
 *   bar   the strip under the header on every other guest page
 *   rail  the room page's booking card (with `room`, and children for totals)
 */
export function StaySearch({
  locale,
  variant,
  room,
  submitLabel,
  children,
  className,
  compact = false,
}: {
  locale: Lang;
  variant: Variant;
  /** Pre-selects this room on /book (room pages). */
  room?: string;
  submitLabel?: string;
  /** Extra content inside the form, before the button (the room totals). */
  children?: React.ReactNode;
  className?: string;
  /** rail only: the phone card, dates and guests on one row. */
  compact?: boolean;
}) {
  const inLabel = t(locale, "avail.in");
  const outLabel = t(locale, "avail.out");
  const guestsLabel = t(locale, "avail.guests");
  const submit = submitLabel ?? t(locale, "avail.go");
  const guestOptions = Array.from({ length: MAX_GUESTS }, (_, i) => String(i + 1));

  const dateField = (name: "in" | "out", label: string, valueClass: string, capClass: string) => (
    <label className="relative block min-w-0">
      <span className={cn("stay-cap", capClass)}>{label}</span>
      <span
        aria-hidden
        data-stay-text={name}
        data-empty={label}
        className={cn("stay-text block truncate", valueClass)}
      />
      <input type="date" name={name} aria-label={label} className="stay-date" />
    </label>
  );

  const guestsSelect = (selectClass: string) => (
    <select
      name="g"
      defaultValue="2"
      aria-label={guestsLabel}
      className={cn("stay-guests cursor-pointer appearance-none bg-transparent outline-none", selectClass)}
    >
      {guestOptions.map((n) => (
        <option key={n} value={n}>
          {t(locale, `g${n}`)}
        </option>
      ))}
    </select>
  );

  const hidden = room ? <input type="hidden" name="room" value={room} /> : null;
  const common = {
    action: "/book",
    method: "get" as const,
    "data-stay-search": variant,
    "data-intl": intlTag(locale),
  };

  if (variant === "hero") {
    const [tonightBefore, tonightAfter = ""] = t(locale, "hero.tonight").split("{z}");
    return (
      <>
        <form {...common} className={cn("relative w-full md:max-w-[720px]", className)}>
          {hidden}
          {/* Tonight chip · the v7 placement */}
          <div
            className="pointer-events-none absolute -top-3 left-4 z-10 origin-bottom-left -rotate-[6deg]"
            aria-hidden
          >
            <span className="inline-flex whitespace-nowrap rounded-full bg-[#C23418] px-3 py-1 text-[13px] font-bold text-white shadow-card">
              <span>
                {tonightBefore}
                <Price thb={2100} />
                {tonightAfter}
              </span>
            </span>
          </div>

          <div
            className="flex h-14 w-full items-center gap-2 rounded-full border border-line bg-white pl-3 pr-2 shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:gap-0 md:pl-0"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-2.5 md:px-5">
              <CalendarDays className="h-5 w-5 shrink-0 text-blue" aria-hidden />
              {dateField("in", inLabel, "text-[14px] font-semibold text-ink md:text-[15px]", "sr-only")}
              <span className="stay-arrow inline-block shrink-0 text-sub" aria-hidden>
                →
              </span>
              {dateField("out", outLabel, "text-[14px] font-semibold text-ink md:text-[15px]", "sr-only")}
            </div>
            <div className="my-4 hidden w-px shrink-0 self-stretch bg-line md:block" aria-hidden />
            <div className="flex shrink-0 items-center gap-2.5 md:px-5">
              <User className="hidden h-5 w-5 shrink-0 text-blue md:block" aria-hidden />
              {guestsSelect("text-[14px] font-semibold text-ink md:text-[15px]")}
            </div>
            <button
              type="submit"
              aria-label={submit}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue text-white md:ml-1 md:inline-flex md:h-[52px] md:w-auto md:gap-2 md:whitespace-nowrap md:px-7 md:text-[15px] md:font-bold"
            >
              <span className="hidden md:inline">{submit}</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </form>
        <script dangerouslySetInnerHTML={{ __html: STAY_FORM_JS }} />
      </>
    );
  }

  if (variant === "rail") {
    // Phones get the compact card (dates and guests on one row): it is a
    // fixed bottom card there and must leave the room page readable.
    const box = cn(
      "relative block rounded-xl border border-line bg-white py-2.5",
      compact ? "px-2.5" : "px-4"
    );
    const capCls = cn(
      "block font-bold uppercase text-sub",
      compact ? "text-[10px] tracking-[0.08em]" : "text-[11px] tracking-[0.14em]"
    );
    const valCls = cn("font-semibold text-ink", compact ? "text-[14px]" : "text-[15px]");
    return (
      <>
        <form {...common} className={cn(compact ? "space-y-2" : "space-y-3", className)}>
          {hidden}
          <div className={cn("grid gap-3", compact ? "grid-cols-3 gap-2" : "grid-cols-2")}>
            <div className={box}>{dateField("in", inLabel, valCls, capCls)}</div>
            <div className={box}>{dateField("out", outLabel, valCls, capCls)}</div>
            <label className={cn(box, !compact && "col-span-2")}>
              <span className={capCls}>{guestsLabel}</span>
              {guestsSelect(cn("w-full", valCls))}
            </label>
          </div>
          {children}
          <button
            type="submit"
            className={cn(
              "flex w-full items-center justify-center rounded-full bg-blue text-sm font-bold text-white transition hover:bg-blue-dark",
              compact ? "py-3" : "mt-2 py-3.5"
            )}
          >
            {submit}
          </button>
        </form>
        <script dangerouslySetInnerHTML={{ __html: STAY_FORM_JS }} />
      </>
    );
  }

  // bar · the strip under the header
  const cap = "hidden text-[11px] font-bold uppercase tracking-[0.14em] text-sub md:block";
  const box =
    "relative flex min-w-0 flex-col justify-center rounded-xl border border-line bg-white px-2.5 md:px-4 h-12 md:h-[58px]";
  return (
    <div role="search" data-stay-bar className={cn("border-b border-line bg-white", className)}>
      <form {...common} className="mx-auto flex max-w-[1180px] items-center gap-1.5 px-4 py-2.5 md:gap-3 md:px-6 md:py-3">
        {hidden}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-3">
          <div className={cn(box, "flex-1")}>
            {dateField("in", inLabel, "text-[14px] font-semibold text-ink md:text-[15px]", cap)}
          </div>
          <span className="stay-arrow hidden shrink-0 text-sub sm:inline-block" aria-hidden>
            →
          </span>
          <div className={cn(box, "flex-1")}>
            {dateField("out", outLabel, "text-[14px] font-semibold text-ink md:text-[15px]", cap)}
          </div>
          <label className={cn(box, "shrink-0 md:w-[160px]")}>
            <span className={cap}>{guestsLabel}</span>
            {guestsSelect("text-[14px] font-semibold text-ink md:text-[15px]")}
          </label>
        </div>
        <button
          type="submit"
          aria-label={submit}
          className="btn-primary h-12 shrink-0 px-4 md:h-[58px] md:px-7"
        >
          <span className="hidden md:inline">{submit}</span>
          <ArrowRight className="h-4 w-4 md:hidden" aria-hidden />
        </button>
      </form>
      <script dangerouslySetInnerHTML={{ __html: STAY_FORM_JS }} />
    </div>
  );
}
