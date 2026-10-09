"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  dayRole,
  MAX_STAY_NIGHTS,
  monthGrid,
  nightsOf,
  pickDay,
  type DayIso,
  type RangeFocus,
  type StayRange,
} from "@/lib/dateRange";
import { formatLongDate, formatMonthCaption, formatWeekdayShort, intlTag, weekStartsOn } from "@/lib/i18n-core";
import type { Lang } from "@/lib/locales/meta";
import { cn } from "@/lib/utils";

/** How far ahead a stay may start (lib/stayDate MAX_LEAD_DAYS). */
const MAX_LEAD_DAYS = 548;

type Props = {
  lang: Lang;
  value: StayRange;
  focus: RangeFocus;
  onChange: (next: StayRange) => void;
  /** The hotel's today · nothing before it can be picked. */
  today: DayIso;
  months?: 1 | 2;
  priceFor?: (iso: DayIso) => number | null;
  formatPrice?: (thb: number) => string;
  labels: { prev: string; next: string; from: string };
  className?: string;
};

function monthOf(iso: DayIso): { y: number; m: number } {
  const [y, m] = iso.split("-").map(Number);
  return { y, m: m - 1 };
}

function shiftMonth(v: { y: number; m: number }, n: number) {
  const d = new Date(Date.UTC(v.y, v.m + n, 1, 12));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
}

function addMonthsIso(iso: DayIso, n: number): DayIso {
  const [y, m, d] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0, 12)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(d, last), 12)).toISOString().slice(0, 10);
}

function monthKey(v: { y: number; m: number }) {
  return v.y * 12 + v.m;
}

/**
 * The stay calendar · one or two months, a real range, keyboard and touch.
 *
 * Every click goes through lib/dateRange pickDay(), so the range it reports is
 * always arrival before departure (Mike's reversed-range bug cannot happen
 * here). Arrow keys move a day or a week, Home and End go to the week's ends,
 * Page Up and Page Down change month (with Shift, a year), Enter or Space
 * picks. Hovering a day after the arrival previews the stay. Nightly "from"
 * prices sit under each day when the caller has them; the lowest nights in
 * view are marked in green.
 */
export function RangeCalendar({
  lang,
  value,
  focus,
  onChange,
  today,
  months = 1,
  priceFor,
  formatPrice,
  labels,
  className,
}: Props) {
  const maxDay = addDays(today, MAX_LEAD_DAYS);
  const start = value.from && value.from >= today ? value.from : today;
  const [view, setView] = useState(() => monthOf(focus === "out" && value.to ? value.to : start));
  const [focused, setFocused] = useState<DayIso>(() => (focus === "out" && value.to ? value.to : start));
  const [hover, setHover] = useState<DayIso | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const wso = weekStartsOn(lang);
  const rtl = lang === "ar";

  const visible = useMemo(
    () => Array.from({ length: months }, (_, i) => shiftMonth(view, i)),
    [view, months]
  );
  const minView = monthOf(today);
  const canPrev = monthKey(view) > monthKey(minView);
  const canNext = monthKey(shiftMonth(view, months - 1)) < monthKey(monthOf(maxDay));

  // The weekday header, Monday or Sunday first.
  const weekdays = useMemo(() => {
    // 2024-01-01 was a Monday.
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDays("2024-01-01", ((wso === 0 ? -1 : 0) + i + 7) % 7);
      return formatWeekdayShort(lang, iso);
    });
  }, [lang, wso]);

  // Lowest price in view · those nights get the green mark.
  const lowest = useMemo(() => {
    if (!priceFor) return null;
    let min: number | null = null;
    for (const v of visible) {
      for (const week of monthGrid(v.y, v.m, wso)) {
        for (const d of week) {
          if (!d || d < today || d > maxDay) continue;
          const p = priceFor(d);
          if (p != null && (min == null || p < min)) min = p;
        }
      }
    }
    return min;
  }, [priceFor, visible, wso, today, maxDay]);

  const choosingDeparture = Boolean(value.from && (!value.to || focus === "out"));

  function disabled(d: DayIso): boolean {
    if (d < today || d > maxDay) return true;
    if (choosingDeparture && value.from && d > value.from && nightsOf(value.from, d) > MAX_STAY_NIGHTS) return true;
    return false;
  }

  function moveFocus(next: DayIso) {
    if (next < today) next = today;
    if (next > maxDay) next = maxDay;
    setFocused(next);
    const nm = monthOf(next);
    const first = monthKey(view);
    const last = first + months - 1;
    const k = monthKey(nm);
    if (k < first) setView(nm);
    else if (k > last) setView(shiftMonth(nm, -(months - 1)));
    moved.current = true;
  }

  // Keep DOM focus on the focused day after keyboard moves.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`button[data-day="${focused}"]`);
    el?.focus();
  }, [focused, view]);

  function onKey(e: React.KeyboardEvent<HTMLButtonElement>, d: DayIso) {
    const dir = rtl ? -1 : 1;
    let next: DayIso | null = null;
    switch (e.key) {
      case "ArrowRight":
        next = addDays(d, dir);
        break;
      case "ArrowLeft":
        next = addDays(d, -dir);
        break;
      case "ArrowDown":
        next = addDays(d, 7);
        break;
      case "ArrowUp":
        next = addDays(d, -7);
        break;
      case "Home": {
        const [y, m, dd] = d.split("-").map(Number);
        const wd = new Date(Date.UTC(y, m - 1, dd, 12)).getUTCDay();
        next = addDays(d, -((wd - wso + 7) % 7));
        break;
      }
      case "End": {
        const [y, m, dd] = d.split("-").map(Number);
        const wd = new Date(Date.UTC(y, m - 1, dd, 12)).getUTCDay();
        next = addDays(d, 6 - ((wd - wso + 7) % 7));
        break;
      }
      case "PageUp":
        next = addMonthsIso(d, e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        next = addMonthsIso(d, e.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (next) moveFocus(next);
  }

  function pick(d: DayIso) {
    if (disabled(d)) return;
    setFocused(d);
    onChange(pickDay(value, d, focus));
  }

  const tag = intlTag(lang);
  const dayNum = useMemo(() => {
    try {
      return new Intl.NumberFormat(tag, { useGrouping: false });
    } catch {
      return new Intl.NumberFormat("en");
    }
  }, [tag]);

  return (
    <div className={cn("select-none", className)} data-calendar>
      <div className="relative">
        <button
          type="button"
          onClick={() => canPrev && setView((v) => shiftMonth(v, -1))}
          disabled={!canPrev}
          aria-label={labels.prev}
          className="absolute start-0 top-0 grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ivory disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => canNext && setView((v) => shiftMonth(v, 1))}
          disabled={!canNext}
          aria-label={labels.next}
          className="absolute end-0 top-0 grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ivory disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </button>
        <div ref={gridRef} className={cn("grid gap-8", months === 2 && "md:grid-cols-2")}>
          {visible.map((v) => {
            const weeks = monthGrid(v.y, v.m, wso);
            const caption = formatMonthCaption(lang, `${v.y}-${String(v.m + 1).padStart(2, "0")}-01`);
            return (
              <div key={`${v.y}-${v.m}`} className="min-w-0">
                <p className="mb-3 flex h-10 items-center justify-center font-display text-[19px] text-ink" aria-live="polite">
                  {caption}
                </p>
                <table role="grid" aria-label={caption} className="w-full table-fixed border-collapse">
                  <thead>
                    <tr>
                      {weekdays.map((w, i) => (
                        <th
                          key={i}
                          scope="col"
                          className="pb-2 text-center text-[12px] font-semibold uppercase tracking-[0.06em] text-sub"
                        >
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, wi) => (
                      <tr key={wi}>
                        {week.map((d, di) => {
                          if (!d) return <td key={di} className="p-0" aria-hidden />;
                          const role = dayRole(value, d, choosingDeparture ? hover : null);
                          const off = disabled(d);
                          const price = !off && priceFor ? priceFor(d) : null;
                          const ends = role === "start" || role === "end" || role === "single";
                          const isToday = d === today;
                          const label = `${formatLongDate(lang, d)}${price != null && formatPrice ? `, ${labels.from} ${formatPrice(price)}` : ""}`;
                          return (
                            <td
                              key={di}
                              role="gridcell"
                              aria-selected={role ? true : undefined}
                              className={cn(
                                "relative p-0 text-center",
                                role === "middle" && "bg-forest-soft",
                                role === "start" && "bg-gradient-to-r from-transparent from-50% to-forest-soft to-50% rtl:bg-gradient-to-l",
                                role === "end" && "bg-gradient-to-l from-transparent from-50% to-forest-soft to-50% rtl:bg-gradient-to-r"
                              )}
                            >
                              <button
                                type="button"
                                data-day={d}
                                tabIndex={d === focused ? 0 : -1}
                                disabled={off}
                                aria-label={label}
                                aria-pressed={ends ? true : undefined}
                                onClick={() => pick(d)}
                                onKeyDown={(e) => onKey(e, d)}
                                onFocus={() => setFocused(d)}
                                onMouseEnter={() => setHover(d)}
                                onMouseLeave={() => setHover(null)}
                                className={cn(
                                  "relative mx-auto flex w-full max-w-[52px] flex-col items-center justify-center rounded-full text-[15px] leading-none transition-colors duration-150",
                                  priceFor ? "h-[54px]" : "h-[46px]",
                                  off
                                    ? "cursor-default text-ink/25"
                                    : ends
                                      ? "bg-forest font-semibold text-white"
                                      : "text-ink hover:bg-ivory",
                                  !off && !ends && isToday && "font-semibold"
                                )}
                              >
                                <span>{dayNum.format(Number(d.slice(8)))}</span>
                                {price != null && formatPrice ? (
                                  <span
                                    className={cn(
                                      "mt-1 text-[10.5px] font-medium tracking-tight",
                                      ends ? "text-white/85" : price === lowest ? "text-forest" : "text-sub"
                                    )}
                                  >
                                    {formatPrice(price)}
                                  </span>
                                ) : null}
                                {isToday && !ends ? (
                                  <span className="absolute top-1.5 h-1 w-1 rounded-full bg-teak" aria-hidden />
                                ) : null}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
