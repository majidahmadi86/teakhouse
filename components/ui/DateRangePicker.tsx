"use client";

import { Fragment, useMemo } from "react";
import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

type DateRangePickerProps = {
  from?: Date;
  to?: Date;
  onChange: (from: Date | undefined, to: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  numberOfMonths?: 1 | 2;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRange(from?: Date, to?: Date): string | null {
  if (!from) return null;
  if (!to) return format(from, "d MMM yyyy");
  if (from.getTime() === to.getTime()) return format(from, "d MMM yyyy");
  return `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Select dates",
  className,
  numberOfMonths = 1,
}: DateRangePickerProps) {
  const selected = useMemo<DateRange | undefined>(
    () => (from || to ? { from, to } : undefined),
    [from, to]
  );

  const label = formatRange(from, to) ?? placeholder;
  const today = startOfToday();

  return (
    <Popover className={cn("relative", className)}>
      {({ close }) => (
        <>
          <PopoverButton
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left text-base text-ink transition hover:border-brand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <CalendarDays className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <span className={cn(!from && "text-strike")}>{label}</span>
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className="absolute left-0 z-50 mt-2 rounded-2xl bg-white p-4 shadow-xl">
              <DayPicker
                mode="range"
                selected={selected}
                onSelect={(range) => {
                  onChange(range?.from, range?.to);
                  if (range?.from && range?.to) close();
                }}
                numberOfMonths={numberOfMonths}
                disabled={{ before: today }}
                showOutsideDays
                className="tkh-day-picker"
                classNames={{
                  months: "flex flex-col gap-4 sm:flex-row",
                  month: "space-y-3",
                  caption: "relative flex items-center justify-center px-8",
                  caption_label: "font-display text-lg font-semibold text-brand",
                  nav: "flex items-center gap-1",
                  nav_button:
                    "inline-flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-deal-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell:
                    "w-10 text-center text-xs font-semibold uppercase tracking-wide text-strike",
                  row: "mt-1 flex w-full",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  day: "inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-deal-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  day_selected:
                    "bg-brand text-white hover:bg-brand hover:text-white focus:bg-brand focus:text-white",
                  day_range_start: "bg-brand text-white hover:bg-brand hover:text-white",
                  day_range_end: "bg-brand text-white hover:bg-brand hover:text-white",
                  day_range_middle: "rounded-none bg-deal-bg text-brand aria-selected:text-brand",
                  day_disabled: "text-strike opacity-40 hover:bg-transparent",
                  day_outside: "text-strike opacity-40",
                  day_today: "font-bold text-brand",
                }}
              />
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
