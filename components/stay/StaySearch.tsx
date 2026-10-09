import { ArrowRight } from "lucide-react";
import { intlTag, nightsForms } from "@/lib/i18n-core";
import { MAX_GUESTS } from "@/lib/stayDate";
import { STAY_FORM_JS } from "@/lib/staySearchScript";
import { t } from "@/lib/serverLocale";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/locales/meta";

type Variant = "hero" | "bar" | "rail";

/**
 * StaySearch · the booking bar, a REAL form: GET /book?in&out&g[&room].
 *
 * Server HTML with no hydration of its own:
 * - lib/staySearchScript.ts (inlined once in the root layout) fills default
 *   dates on the hotel's clock, keeps departure after arrival, and draws the
 *   labels ("Fri 10 Oct") and the nights ("2 nights") in the page language;
 * - components/stay/StayCalendarHost (one island per page) opens the range
 *   calendar from either date field and writes the stay back into this
 *   form's own inputs;
 * - with scripting off the native date inputs show themselves (the
 *   <noscript> style in the root layout) and the form still submits.
 *
 * So "Check rates" always submits exactly what the guest sees, and /book
 * opens with it applied.
 *
 *   hero  the home hero's booking panel
 *   bar   the strip under the header on every other guest page
 *   rail  a room page's booking card (with `room`, and children for totals)
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
  const forms = JSON.stringify(nightsForms(locale));

  const dateField = (
    name: "in" | "out",
    label: string,
    opts: { cap: string; value: string; box?: string; nights?: boolean }
  ) => (
    <label data-stay-field={name} className={cn("stay-field relative block min-w-0 cursor-pointer", opts.box)}>
      <span className={cn("stay-cap flex items-center gap-1.5", opts.cap)}>
        <span>{label}</span>
        {opts.nights ? (
          <span suppressHydrationWarning data-stay-nights data-forms={forms} className="stay-nights normal-case tracking-normal text-teak" />
        ) : null}
      </span>
      <span suppressHydrationWarning aria-hidden data-stay-text={name} data-empty={label} className={cn("stay-text block truncate", opts.value)} />
      <input suppressHydrationWarning type="date" name={name} aria-label={label} className="stay-date" />
    </label>
  );

  const guestsSelect = (selectClass: string) => (
    <select
      name="g"
      defaultValue="2"
      aria-label={guestsLabel}
      className={cn("stay-guests w-full cursor-pointer appearance-none bg-transparent outline-none", selectClass)}
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
    suppressHydrationWarning: true,
    action: "/book",
    method: "get" as const,
    "data-stay-search": variant,
    "data-intl": intlTag(locale),
  };

  const capCls = "text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sub";

  if (variant === "hero") {
    return (
      <>
        <form
          {...common}
          className={cn(
            "relative w-full rounded-card bg-white p-2 text-ink shadow-float md:flex md:items-stretch md:p-2",
            className
          )}
        >
          {hidden}
          <div data-stay-dates className="grid grid-cols-2 md:flex-[1.6]">
            {dateField("in", inLabel, {
              cap: capCls,
              value: "mt-1.5 text-[17px] font-medium text-ink md:text-[18px]",
              box: "rounded-soft px-4 py-3 transition hover:bg-stone md:px-5 md:py-3.5",
            })}
            {dateField("out", outLabel, {
              cap: capCls,
              value: "mt-1.5 text-[17px] font-medium text-ink md:text-[18px]",
              box: "rounded-soft border-s border-line px-4 py-3 transition hover:bg-stone md:px-5 md:py-3.5",
              nights: true,
            })}
          </div>
          <label className="relative block border-t border-line px-4 py-3 transition hover:bg-stone md:flex-1 md:rounded-soft md:border-s md:border-t-0 md:px-5 md:py-3.5">
            <span className={cn("block", capCls)}>{guestsLabel}</span>
            {guestsSelect("mt-1.5 text-[17px] font-medium text-ink md:text-[18px]")}
          </label>
          <button
            type="submit"
            className="btn-primary mt-2 h-[56px] w-full text-[16px] md:ms-2 md:mt-0 md:h-auto md:w-auto md:px-9"
          >
            {submit}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
        </form>
        <script dangerouslySetInnerHTML={{ __html: STAY_FORM_JS }} />
      </>
    );
  }

  if (variant === "rail") {
    const box = cn("rounded-soft border border-line bg-white transition hover:border-ink/30", compact ? "px-3 py-2" : "px-4 py-3");
    const valCls = cn("mt-1 font-medium text-ink", compact ? "text-[15px]" : "text-[16px]");
    const cap = cn(capCls, compact && "text-[10.5px] tracking-[0.12em]");
    return (
      <>
        <form {...common} className={cn(compact ? "space-y-2" : "space-y-3", className)}>
          {hidden}
          <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2")}>
            <div data-stay-dates className={cn("grid grid-cols-2 gap-2", compact ? "col-span-2" : "col-span-2")}>
              {dateField("in", inLabel, { cap, value: valCls, box })}
              {dateField("out", outLabel, { cap, value: valCls, box, nights: !compact })}
            </div>
            <label className={cn(box, "block", !compact && "col-span-2")}>
              <span className={cn("block", cap)}>{guestsLabel}</span>
              {guestsSelect(valCls)}
            </label>
          </div>
          {children}
          <button type="submit" className={cn("btn-primary w-full", compact ? "h-12" : "h-[52px]")}>
            {submit}
          </button>
        </form>
        <script dangerouslySetInnerHTML={{ __html: STAY_FORM_JS }} />
      </>
    );
  }

  // bar · the strip under the header on every other guest page
  return (
    <div role="search" data-stay-bar className={cn("border-b border-line bg-ivory/70", className)}>
      <form {...common} className="wrap flex items-center gap-2 py-2.5 md:gap-3 md:py-3">
        {hidden}
        <p className="me-2 hidden shrink-0 font-display text-[19px] text-ink lg:block">{t(locale, "stay.yourStay")}</p>
        <div
          data-stay-dates
          className="grid min-w-0 flex-1 grid-cols-2 rounded-soft border border-line bg-white md:flex-[1.4]"
        >
          {dateField("in", inLabel, {
            cap: cn("hidden md:flex", capCls, "text-[10.5px]"),
            value: "text-[14.5px] font-medium text-ink md:mt-0.5 md:text-[15.5px]",
            box: "px-3 py-2.5 md:px-4 md:py-2",
          })}
          {dateField("out", outLabel, {
            cap: cn("hidden md:flex", capCls, "text-[10.5px]"),
            value: "text-[14.5px] font-medium text-ink md:mt-0.5 md:text-[15.5px]",
            box: "border-s border-line px-3 py-2.5 md:px-4 md:py-2",
            nights: true,
          })}
        </div>
        <label className="relative block w-[92px] shrink-0 rounded-soft border border-line bg-white px-3 py-2.5 md:w-[170px] md:px-4 md:py-2">
          <span className={cn("hidden md:block", capCls, "text-[10.5px]")}>{guestsLabel}</span>
          {guestsSelect("text-[14.5px] font-medium text-ink md:mt-0.5 md:text-[15.5px]")}
        </label>
        <button
          type="submit"
          aria-label={submit}
          className="btn-primary h-[46px] w-[46px] shrink-0 px-0 md:h-[54px] md:w-auto md:px-7"
        >
          <span className="hidden md:inline">{submit}</span>
          <ArrowRight className="h-4 w-4 md:hidden rtl:rotate-180" aria-hidden />
        </button>
      </form>
      <script dangerouslySetInnerHTML={{ __html: STAY_FORM_JS }} />
    </div>
  );
}
