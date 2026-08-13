"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isSameDay,
  startOfDay,
} from "date-fns";
import { CalendarDays, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { dfLocale } from "@/lib/dateLocale";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "date-fns";
import { useIsMobile } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";
import "react-day-picker/dist/style.css";

const DayPicker = dynamic(
  () => import("react-day-picker").then((m) => m.DayPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center text-sm font-semibold text-sub">
        …
      </div>
    ),
  }
);

type DateRangePickerProps = {
  from?: Date;
  to?: Date;
  onChange: (from: Date | undefined, to: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  numberOfMonths?: 1 | 2;
  /**
   * Effective nightly rate for a date · rendered under the day number the way
   * the OTAs do it. Return null when the price is not known yet, so the
   * calendar shows nothing rather than a price it would have to take back.
   */
  priceFor?: (dateIso: string) => number | null;
  /** Currency-aware formatter for the day prices. */
  formatPrice?: (amountThb: number) => string;
};

/** Panel height assumed before the panel has ever been measured. */
const ASSUMED_PANEL_H = 400;
const MIN_PANEL_H = 260;
const GAP = 8;

function startOfToday(): Date {
  return startOfDay(new Date());
}

function isoOf(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function formatRange(
  from?: Date,
  to?: Date,
  dfl?: { locale: Locale }
): string | null {
  if (!from) return null;
  if (!to) return format(from, "d MMM yyyy", dfl);
  if (isSameDay(from, to)) return format(from, "d MMM yyyy", dfl);
  return `${format(from, "d MMM", dfl)} - ${format(to, "d MMM yyyy", dfl)}`;
}

function nightsCount(from?: Date, to?: Date): number {
  if (!from || !to) return 0;
  const n = differenceInCalendarDays(to, from);
  return n > 0 ? n : 0;
}

/**
 * What is fixed to the top and bottom of the viewport right now.
 * Measured from the live DOM rather than assumed from CSS vars, so the popover
 * clears the sticky header, the demo bar, and the booking action bar even when
 * one of them is absent on the current route.
 */
function measureObstructions(): { top: number; bottom: number } {
  let top = 0;
  let bottom = 0;

  for (const el of Array.from(
    document.querySelectorAll<HTMLElement>(
      "header, [data-demo-bar], [data-booking-action-bar]"
    )
  )) {
    const position = getComputedStyle(el).position;
    if (position !== "fixed" && position !== "sticky") continue;
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) continue;
    // Anchored to the top half of the viewport -> it eats space from the top.
    if (rect.top <= window.innerHeight / 2) {
      top = Math.max(top, rect.bottom);
    } else {
      bottom = Math.max(bottom, window.innerHeight - rect.top);
    }
  }

  return { top: Math.max(0, top), bottom: Math.max(0, bottom) };
}

type Placement = { side: "top" | "bottom"; maxHeight: number };

/**
 * Collision-aware placement for the desktop popover: below the field by
 * default, flipped above when the space under it is too short to hold the
 * calendar, and always capped so the panel scrolls instead of being clipped.
 * Recomputed on scroll and resize while the popover is open.
 */
function usePlacement(
  anchorRef: React.RefObject<HTMLElement>,
  open: boolean,
  measuredHeight: React.MutableRefObject<number>
): Placement {
  const [placement, setPlacement] = useState<Placement>({
    side: "bottom",
    maxHeight: ASSUMED_PANEL_H,
  });

  useEffect(() => {
    if (!open) return;

    const compute = () => {
      const el = anchorRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const guards = measureObstructions();
      const wanted = measuredHeight.current || ASSUMED_PANEL_H;

      const below = window.innerHeight - guards.bottom - rect.bottom - GAP;
      const above = rect.top - guards.top - GAP;

      const flip = below < wanted && above > below;
      const room = Math.max(MIN_PANEL_H, Math.floor(flip ? above : below));

      setPlacement((prev) =>
        prev.side === (flip ? "top" : "bottom") && prev.maxHeight === room
          ? prev
          : { side: flip ? "top" : "bottom", maxHeight: room }
      );
    };

    compute();
    window.addEventListener("resize", compute);
    // capture: catches scrolling inside any ancestor, not just the window
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef, measuredHeight]);

  return placement;
}

/** Freeze background scroll while the mobile sheet owns the screen. */
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Select dates",
  className,
  numberOfMonths = 1,
  priceFor,
  formatPrice,
}: DateRangePickerProps) {
  const { t, lang } = useI18n();
  const isMobile = useIsMobile();
  const today = startOfToday();

  const [draftFrom, setDraftFrom] = useState<Date | undefined>(from);
  const [draftTo, setDraftTo] = useState<Date | undefined>(to);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const measuredHeight = useRef(0);

  useEffect(() => {
    setDraftFrom(from);
    setDraftTo(to);
  }, [from, to]);

  const hint =
    t("drp.hint") !== "drp.hint"
      ? t("drp.hint")
      : lang === "th"
        ? "คลิกแรก: เช็คอิน · คลิกที่สอง: เช็คเอาท์"
        : "1st click: check-in · 2nd: check-out";

  const nights = nightsCount(draftFrom, draftTo);
  const nightsLabel =
    nights > 0
      ? t("drp.nights") !== "drp.nights"
        ? t("drp.nights", { n: nights })
        : lang === "th"
          ? `${nights} คืน`
          : `${nights} nights`
      : null;

  const selected = useMemo<DateRange | undefined>(() => {
    if (!draftFrom) return undefined;
    return { from: draftFrom, to: draftTo ?? draftFrom };
  }, [draftFrom, draftTo]);

  const label = formatRange(draftFrom, draftTo, dfLocale(lang)) ?? placeholder;
  const doneLabel = t("drp.done");
  const showPrices = Boolean(priceFor && formatPrice);

  const handleSelect = useCallback(
    (range: DateRange | undefined, close?: () => void) => {
      if (!range?.from) {
        setDraftFrom(undefined);
        setDraftTo(undefined);
        onChange(undefined, undefined);
        return;
      }

      const fromDay = startOfDay(range.from);
      const toDay = range.to ? startOfDay(range.to) : undefined;
      const picked = toDay && !isSameDay(fromDay, toDay) ? toDay : fromDay;

      if (draftFrom && draftTo) {
        setDraftFrom(picked);
        setDraftTo(undefined);
        onChange(picked, undefined);
        return;
      }

      if (!draftFrom) {
        setDraftFrom(fromDay);
        setDraftTo(undefined);
        onChange(fromDay, undefined);
        return;
      }

      if (isBefore(picked, draftFrom)) {
        setDraftFrom(picked);
        setDraftTo(undefined);
        onChange(picked, undefined);
        return;
      }

      const end = isSameDay(picked, draftFrom) ? addDays(draftFrom, 1) : picked;

      setDraftTo(end);
      onChange(draftFrom, end);

      // Desktop closes as soon as the range is complete · mobile waits for Apply.
      if (!isMobile && draftFrom < end && close) close();
    },
    [draftFrom, draftTo, isMobile, onChange]
  );

  const dayComponents = useMemo(() => {
    if (!showPrices) return undefined;
    return {
      DayContent: ({ date }: { date: Date }) => {
        const price = priceFor!(isoOf(date));
        return (
          <span className="flex flex-col items-center justify-center leading-none">
            <span>{date.getDate()}</span>
            {price != null ? (
              <span className="mt-0.5 text-[0.58rem] font-bold text-deal">
                {formatPrice!(price)}
              </span>
            ) : null}
          </span>
        );
      },
    };
  }, [showPrices, priceFor, formatPrice]);

  const picker = (close?: () => void) => (
    <>
      <DayPicker
        mode="range"
        /* Month and weekday names follow the UI language · an otherwise Thai
           calendar reading "August / Mo Tu We" is still an English control. */
        locale={dfLocale(lang)?.locale}
        selected={selected}
        onSelect={(range) => handleSelect(range, close)}
        numberOfMonths={isMobile ? 1 : numberOfMonths}
        disabled={{ before: today }}
        showOutsideDays
        components={dayComponents}
        className={cn("tkh-day-picker", showPrices && "tkh-day-picker--prices")}
        classNames={{
          months: "flex flex-col gap-4 sm:flex-row",
          month: "space-y-3",
          caption: "relative flex items-center justify-center px-8",
          caption_label: "font-display text-lg text-navy",
          nav: "flex items-center gap-1",
          nav_button:
            "inline-flex h-11 w-11 items-center justify-center rounded-full text-blue hover:bg-sky focus:outline-none focus-visible:ring-2 focus-visible:ring-sky",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell:
            "w-[var(--rdp-cell-size)] text-center text-xs font-semibold uppercase tracking-wide text-strike",
          row: "mt-1 flex w-full",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          day: "inline-flex h-[var(--rdp-cell-size)] w-[var(--rdp-cell-size)] items-center justify-center rounded-full text-ink hover:bg-sky focus:outline-none focus-visible:ring-2 focus-visible:ring-sky",
          day_selected:
            "bg-blue text-white hover:bg-blue hover:text-white focus:bg-blue focus:text-white",
          day_range_start: "bg-blue text-white hover:bg-blue hover:text-white",
          day_range_end: "bg-blue text-white hover:bg-blue hover:text-white",
          day_range_middle:
            "rounded-none bg-sky text-navy aria-selected:text-navy",
          day_disabled: "text-strike opacity-40 hover:bg-transparent",
          day_outside: "text-strike opacity-40",
          day_today: "font-bold text-blue",
        }}
      />
      <p className="mt-2 text-center text-xs font-semibold text-sub">{hint}</p>
    </>
  );

  return (
    <Popover className={cn("relative", className)}>
      {({ close, open }) => (
        <PickerBody
          open={open}
          close={close}
          isMobile={isMobile}
          buttonRef={buttonRef}
          panelRef={panelRef}
          measuredHeight={measuredHeight}
          label={label}
          placeholder={placeholder}
          hasFrom={Boolean(draftFrom)}
          nightsLabel={nightsLabel}
          doneLabel={doneLabel}
          picker={picker}
        />
      )}
    </Popover>
  );
}

type PickerBodyProps = {
  open: boolean;
  close: () => void;
  isMobile: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  panelRef: React.RefObject<HTMLDivElement>;
  measuredHeight: React.MutableRefObject<number>;
  label: string;
  placeholder: string;
  hasFrom: boolean;
  nightsLabel: string | null;
  doneLabel: string;
  picker: (close?: () => void) => React.ReactNode;
};

function PickerBody({
  open,
  close,
  isMobile,
  buttonRef,
  panelRef,
  measuredHeight,
  label,
  placeholder,
  hasFrom,
  nightsLabel,
  doneLabel,
  picker,
}: PickerBodyProps) {
  const placement = usePlacement(buttonRef, open && !isMobile, measuredHeight);
  useScrollLock(open && isMobile);

  // Remember the real panel height so the next open flips on facts, not a guess.
  useEffect(() => {
    if (!open || isMobile) return;
    const el = panelRef.current;
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      if (el.scrollHeight > 0) measuredHeight.current = el.scrollHeight;
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, isMobile, panelRef, measuredHeight]);

  const trigger = (
    <PopoverButton
      ref={buttonRef}
      type="button"
      // Locale-stable handle · aria-label is translated, so tests and the
      // no-JS shell comparison need something that does not move with language.
      data-date-trigger
      aria-label={placeholder}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left text-base text-ink transition hover:border-blue/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
    >
      <CalendarDays className="h-5 w-5 shrink-0 text-blue" aria-hidden />
      <span className={cn(!hasFrom && "text-strike")}>{label}</span>
    </PopoverButton>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Transition
          show={open}
          as={Fragment}
          enter="transition duration-200 ease-out"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="transition duration-150 ease-in"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
        >
          {/* Full-screen sheet · solid, never a dropdown clipped by the fold. */}
          <PopoverPanel
            static
            portal
            className="fixed inset-0 z-popover flex flex-col bg-white"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") close();
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-display text-lg text-ink">{placeholder}</h2>
              <button
                type="button"
                onClick={() => close()}
                className="grid h-11 w-11 place-items-center rounded-full text-sub transition hover:bg-cloud"
                aria-label={doneLabel}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {open ? picker() : null}
            </div>

            <div className="sticky bottom-0 shrink-0 border-t border-line bg-white px-4 pb-safe pt-3">
              {nightsLabel ? (
                <p className="mb-2 text-center text-sm font-bold text-navy">
                  {nightsLabel}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => close()}
                className="btn-primary min-h-[48px] w-full"
              >
                {doneLabel}
              </button>
            </div>
          </PopoverPanel>
        </Transition>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel
          ref={panelRef}
          portal
          anchor={{
            to: placement.side === "top" ? "top start" : "bottom start",
            gap: GAP,
            padding: 12,
          }}
          style={{ maxHeight: placement.maxHeight }}
          className="z-popover w-auto overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-xl"
        >
          {open ? picker(close) : null}
          {nightsLabel ? (
            <div className="mt-3 border-t border-line pt-3 text-center text-sm font-bold text-navy">
              {nightsLabel}
            </div>
          ) : null}
        </PopoverPanel>
      </Transition>
    </>
  );
}
