"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useI18n } from "@/lib/i18n";
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
};

function startOfToday(): Date {
  return startOfDay(new Date());
}

function formatRange(from?: Date, to?: Date): string | null {
  if (!from) return null;
  if (!to) return format(from, "d MMM yyyy");
  if (isSameDay(from, to)) return format(from, "d MMM yyyy");
  return `${format(from, "d MMM")} - ${format(to, "d MMM yyyy")}`;
}

function nightsCount(from?: Date, to?: Date): number {
  if (!from || !to) return 0;
  const n = differenceInCalendarDays(to, from);
  return n > 0 ? n : 0;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Select dates",
  className,
  numberOfMonths = 1,
}: DateRangePickerProps) {
  const { t, lang } = useI18n();
  const isMobile = useIsMobile();
  const today = startOfToday();

  const [draftFrom, setDraftFrom] = useState<Date | undefined>(from);
  const [draftTo, setDraftTo] = useState<Date | undefined>(to);

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

  const label = formatRange(draftFrom, draftTo) ?? placeholder;
  const doneLabel = lang === "th" ? "เสร็จสิ้น" : "Done";

  function handleSelect(range: DateRange | undefined, close?: () => void) {
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

    let end = picked;
    if (isSameDay(picked, draftFrom)) {
      end = addDays(draftFrom, 1);
    }

    setDraftTo(end);
    onChange(draftFrom, end);

    if (!isMobile && draftFrom < end && close) {
      close();
    }
  }

  const picker = (close?: () => void) => (
    <>
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={(range) => handleSelect(range, close)}
        numberOfMonths={isMobile ? 1 : numberOfMonths}
        disabled={{ before: today }}
        showOutsideDays
        className="tkh-day-picker"
        classNames={{
          months: "flex flex-col gap-4 sm:flex-row",
          month: "space-y-3",
          caption: "relative flex items-center justify-center px-8",
          caption_label: "font-display text-lg text-navy",
          nav: "flex items-center gap-1",
          nav_button:
            "inline-flex h-9 w-9 items-center justify-center rounded-full text-blue hover:bg-sky focus:outline-none focus-visible:ring-2 focus-visible:ring-sky",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell:
            "w-10 text-center text-xs font-semibold uppercase tracking-wide text-strike",
          row: "mt-1 flex w-full",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          day: "inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-sky focus:outline-none focus-visible:ring-2 focus-visible:ring-sky",
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
      {nightsLabel ? (
        <div className="mt-3 border-t border-line pt-3 text-center text-sm font-bold text-navy">
          {nightsLabel}
        </div>
      ) : null}
    </>
  );

  return (
    <Popover className={cn("relative", className)}>
      {({ close, open }) => (
        <>
          <PopoverButton
            type="button"
            aria-label={placeholder}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left text-base text-ink transition hover:border-blue/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
          >
            <CalendarDays className="h-5 w-5 shrink-0 text-blue" aria-hidden />
            <span className={cn(!draftFrom && "text-strike")}>{label}</span>
          </PopoverButton>

          {isMobile ? (
            <Transition show={open} as={Fragment}>
              <PopoverPanel
                static
                portal
                className="fixed inset-0 z-popover flex flex-col justify-end"
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-navy/40"
                  aria-label="Close"
                  onClick={() => close()}
                />
                <div className="relative rounded-t-3xl bg-white px-4 pb-safe pt-3 shadow-2xl">
                  <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
                  {open ? picker() : null}
                  <button
                    type="button"
                    onClick={() => close()}
                    className="btn-primary mt-4 mb-3 w-full"
                  >
                    {doneLabel}
                  </button>
                </div>
              </PopoverPanel>
            </Transition>
          ) : (
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
                portal
                anchor={{ to: "bottom start", gap: "8px", padding: "12px" }}
                className="z-popover w-auto rounded-2xl bg-white p-4 shadow-xl [--anchor-gap:8px]"
              >
                {open ? picker(close) : null}
              </PopoverPanel>
            </Transition>
          )}
        </>
      )}
    </Popover>
  );
}
