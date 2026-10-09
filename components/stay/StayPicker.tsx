"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { RangeCalendar } from "@/components/stay/RangeCalendar";
import { isComplete, nightsOf, type DayIso, type RangeFocus, type StayRange } from "@/lib/dateRange";
import { formatDay, nightsLabel } from "@/lib/i18n-core";
import type { Lang } from "@/lib/locales/meta";
import { cn } from "@/lib/utils";

export type StayPickerLabels = {
  title: string;
  done: string;
  prev: string;
  next: string;
  from: string;
  close: string;
  /** "Select your check-out date" while only the arrival is chosen. */
  pickOut: string;
  /** "Select your arrival date" before anything is chosen. */
  pickIn: string;
};

type Props = {
  lang: Lang;
  open: boolean;
  anchor: HTMLElement | null;
  value: StayRange;
  focus: RangeFocus;
  today: DayIso;
  onChange: (next: StayRange) => void;
  /** Called with the final range when the guest is done (complete or not). */
  onClose: (final: StayRange) => void;
  labels: StayPickerLabels;
  priceFor?: (iso: DayIso) => number | null;
  formatPrice?: (thb: number) => string;
};

const GAP = 8;
const EDGE = 12;

/** What is fixed to the top and bottom of the viewport right now. */
function obstructions(): { top: number; bottom: number } {
  let top = 0;
  let bottom = 0;
  for (const el of Array.from(
    document.querySelectorAll<HTMLElement>("header, [data-demo-bar], [data-booking-dock], [data-mobile-book-bar]")
  )) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.height || r.bottom <= 0 || r.top >= window.innerHeight) continue;
    if (r.top <= window.innerHeight / 2) top = Math.max(top, r.bottom);
    else bottom = Math.max(bottom, window.innerHeight - r.top);
  }
  return { top, bottom };
}

/**
 * The stay picker · a popover under (or, when the space below is short,
 * above) its field on desktop, never clipped by the viewport; a full-screen
 * solid sheet with a sticky Apply on phones. Holds the summary line that
 * always reads arrival → departure · n nights.
 */
export function StayPicker({
  lang,
  open,
  anchor,
  value,
  focus,
  today,
  onChange,
  onClose,
  labels,
  priceFor,
  formatPrice,
}: Props) {
  const [mobile, setMobile] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number; above: boolean } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useLayoutEffect(() => {
    if (!open) return;
    setMobile(window.matchMedia("(max-width: 767px)").matches);
  }, [open]);

  const place = useCallback(() => {
    if (!anchor || !panelRef.current || mobile) return;
    const r = anchor.getBoundingClientRect();
    const panel = panelRef.current;
    const width = panel.offsetWidth;
    const wanted = panel.scrollHeight;
    const g = obstructions();
    const below = window.innerHeight - g.bottom - r.bottom - GAP - EDGE;
    const aboveSpace = r.top - g.top - GAP - EDGE;
    const above = below < wanted && aboveSpace > below;
    const maxH = Math.max(260, Math.floor(above ? aboveSpace : below));
    const h = Math.min(wanted, maxH);
    let left = r.left;
    left = Math.min(left, window.innerWidth - width - EDGE);
    left = Math.max(EDGE, left);
    const top = above ? r.top - GAP - h : r.bottom + GAP;
    setPos({ top, left, maxH, above });
  }, [anchor, mobile]);

  useLayoutEffect(() => {
    if (!open || mobile) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, mobile, place]);

  // Escape closes; a click outside closes the desktop popover.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose(valueRef.current);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (mobile) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchor?.contains(t)) return;
      onClose(valueRef.current);
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, mobile, anchor, onClose]);

  // The sheet owns the phone screen while it is open.
  useEffect(() => {
    if (!open || !mobile) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open, mobile]);

  // Focus the active day on open.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('button[data-day][tabindex="0"]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open, mobile]);

  if (!open || typeof document === "undefined") return null;

  const complete = isComplete(value);
  const summary = complete
    ? `${formatDay(lang, value.from!)} → ${formatDay(lang, value.to!)} · ${nightsLabel(lang, nightsOf(value.from!, value.to!))}`
    : value.from
      ? `${formatDay(lang, value.from)} → ${labels.pickOut}`
      : labels.pickIn;

  const handleChange = (next: StayRange) => {
    onChange(next);
    // Desktop closes the moment the stay is complete; phones wait for Apply.
    if (!mobile && isComplete(next) && (next.from !== value.from || next.to !== value.to)) {
      onClose(next);
    }
  };

  const calendar = (
    <RangeCalendar
      lang={lang}
      value={value}
      focus={focus}
      onChange={handleChange}
      today={today}
      months={mobile ? 1 : 2}
      priceFor={priceFor}
      formatPrice={formatPrice}
      labels={{ prev: labels.prev, next: labels.next, from: labels.from }}
    />
  );

  if (mobile) {
    return createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        data-stay-sheet
        className="tkh-sheet-in fixed inset-0 z-modal flex flex-col bg-white text-ink"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <p className="font-display text-[19px]">{labels.title}</p>
          <button
            type="button"
            onClick={() => onClose(value)}
            aria-label={labels.close}
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-ivory"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5">{calendar}</div>
        <div className="shrink-0 border-t border-line bg-white px-4 pt-3 [padding-bottom:max(0.9rem,env(safe-area-inset-bottom))]">
          <p className="mb-3 text-center text-[15px] font-medium text-ink" aria-live="polite" data-stay-summary>
            {summary}
          </p>
          <button
            type="button"
            disabled={!complete}
            onClick={() => onClose(value)}
            className="btn-primary h-[52px] w-full"
          >
            {labels.done}
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={labels.title}
      data-stay-popover
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        maxHeight: pos?.maxH,
      }}
      className={cn(
        "tkh-pop-in fixed z-modal w-[min(720px,calc(100vw-24px))] overflow-y-auto overscroll-contain rounded-card border border-line/70 bg-white p-6 text-ink shadow-float",
        !pos && "invisible"
      )}
    >
      {calendar}
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
        <p className="text-[15px] font-medium text-ink" aria-live="polite" data-stay-summary>
          {summary}
        </p>
        <button type="button" onClick={() => onClose(value)} className="btn-secondary min-h-10 px-5 text-[14px]">
          {labels.done}
        </button>
      </div>
    </div>,
    document.body
  );
}
