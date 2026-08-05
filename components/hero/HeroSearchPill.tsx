"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
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
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  User,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/lib/useMediaQuery";
import { cn, isoDate } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 120, damping: 16 };

function formatRange(from?: Date, to?: Date, compact?: boolean): string {
  if (!from) return "";
  if (!to) return format(from, compact ? "d MMM" : "d MMM yyyy");
  if (compact) {
    return `${format(from, "d")}-${format(to, "d MMM")}`;
  }
  if (isSameDay(from, to)) return format(from, "d MMM yyyy");
  return `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`;
}

export function HeroSearchPill({ className }: { className?: string }) {
  const { t } = useI18n();
  const { format: formatPrice } = useCurrency();
  const router = useRouter();
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();

  const [checkIn, setCheckIn] = useState<Date>(() => addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(() => addDays(new Date(), 2));
  const [guests, setGuests] = useState("2");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chipReady, setChipReady] = useState(false);

  useEffect(() => {
    const delay = reduce ? 0 : 900;
    const id = window.setTimeout(() => setChipReady(true), delay);
    return () => window.clearTimeout(id);
  }, [reduce]);

  const guestOptions = useMemo(
    () =>
      ["1", "2", "3", "4"].map((n) => ({
        value: n,
        label: t(`g${n}` as "g1"),
      })),
    [t]
  );

  function goBook() {
    const params = new URLSearchParams();
    params.set("in", isoDate(checkIn));
    params.set("out", isoDate(checkOut));
    params.set("g", guests);
    router.push(`/book?${params.toString()}`);
  }

  const dateLabel = formatRange(checkIn, checkOut);
  const compactLabel = `${formatRange(checkIn, checkOut, true)} · ${t(`g${guests}` as "g1")}`;
  const guestLabel = t(`g${guests}` as "g1");

  const chip = (
    <motion.div
      className="pointer-events-none absolute -top-3 left-4 z-10 origin-bottom-left -rotate-[6deg]"
      initial={reduce ? false : { opacity: 0, scale: 0.6, y: 8 }}
      animate={
        chipReady
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 0, scale: 0.6, y: 8 }
      }
      transition={spring}
    >
      <span className="inline-flex whitespace-nowrap rounded-full bg-coral-deep px-3 py-1 text-[12px] font-bold text-white shadow-card">
        {t("hero.tonight", { z: formatPrice(2100) })}
      </span>
    </motion.div>
  );

  if (isMobile) {
    return (
      <div className={cn("relative w-full", className)}>
        {chip}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-[3.65rem] w-full items-center gap-3 rounded-full border border-white/80 bg-white/97 px-3.5 shadow-[0_20px_50px_rgba(6,22,48,.38)] backdrop-blur-sm"
        >
          <CalendarDays className="h-5 w-5 shrink-0 text-blue" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {compactLabel}
          </span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue text-white shadow-[0_8px_18px_rgba(10,46,92,.35)]">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </button>

        <MobileSearchSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          guestOptions={guestOptions}
          onDates={(from, to) => {
            if (from) setCheckIn(from);
            if (to) setCheckOut(to);
          }}
          onGuests={setGuests}
          onDone={() => {
            setSheetOpen(false);
            goBook();
          }}
          doneLabel={t("drp.done")}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full max-w-[720px]", className)}>
      {chip}
      <div
        className="flex h-[72px] items-stretch overflow-hidden rounded-full border border-line bg-white"
        style={{ boxShadow: "0 16px 44px rgba(10,46,92,.20)" }}
      >
        <DateSegment
          checkIn={checkIn}
          checkOut={checkOut}
          label={dateLabel}
          onChange={(from, to) => {
            if (from) setCheckIn(from);
            if (to) setCheckOut(to);
          }}
        />
        <div className="my-4 w-px shrink-0 bg-line" aria-hidden />
        <GuestSegment
          value={guests}
          label={guestLabel}
          options={guestOptions}
          onChange={setGuests}
        />
        <div className="flex items-center pr-2.5 pl-1">
          <button
            type="button"
            onClick={goBook}
            className="group inline-flex h-[52px] items-center gap-2 whitespace-nowrap rounded-full bg-blue px-7 text-[15px] font-bold text-white transition hover:bg-blue-dark"
          >
            {t("avail.go")}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DateSegment({
  checkIn,
  checkOut,
  label,
  onChange,
}: {
  checkIn: Date;
  checkOut: Date;
  label: string;
  onChange: (from?: Date, to?: Date) => void;
}) {
  const { lang } = useI18n();
  const today = startOfDay(new Date());
  const [draftFrom, setDraftFrom] = useState<Date | undefined>(checkIn);
  const [draftTo, setDraftTo] = useState<Date | undefined>(checkOut);

  useEffect(() => {
    setDraftFrom(checkIn);
    setDraftTo(checkOut);
  }, [checkIn, checkOut]);

  const selected: DateRange | undefined = draftFrom
    ? { from: draftFrom, to: draftTo ?? draftFrom }
    : undefined;

  function handleSelect(range: DateRange | undefined, close?: () => void) {
    if (!range?.from) {
      setDraftFrom(undefined);
      setDraftTo(undefined);
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
    if (isSameDay(picked, draftFrom)) end = addDays(draftFrom, 1);
    setDraftTo(end);
    onChange(draftFrom, end);
    if (draftFrom < end && close) close();
  }

  const nights =
    draftFrom && draftTo
      ? Math.max(0, differenceInCalendarDays(draftTo, draftFrom))
      : 0;

  return (
    <Popover className="relative flex min-w-0 flex-1">
      {({ close }) => (
        <>
          <PopoverButton className="flex h-full w-full items-center gap-2.5 rounded-l-full px-5 text-left transition hover:bg-sky focus:outline-none focus-visible:ring-2 focus-visible:ring-sky">
            <CalendarDays className="h-5 w-5 shrink-0 text-blue" aria-hidden />
            <span className="truncate text-[15px] font-semibold text-ink">
              {label}
            </span>
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
            <PopoverPanel
              portal
              anchor={{ to: "bottom start", gap: "10px", padding: "12px" }}
              className="z-popover rounded-2xl bg-white p-4 shadow-xl"
            >
              <DayPicker
                mode="range"
                selected={selected}
                onSelect={(range) => handleSelect(range, close)}
                numberOfMonths={1}
                disabled={{ before: today }}
                showOutsideDays
                className="tkh-day-picker"
              />
              {nights > 0 ? (
                <div className="mt-2 border-t border-line pt-2 text-center text-sm font-bold text-navy">
                  {lang === "th" ? `${nights} คืน` : `${nights} nights`}
                </div>
              ) : null}
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

function GuestSegment({
  value,
  label,
  options,
  onChange,
}: {
  value: string;
  label: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative flex w-[160px] shrink-0">
        <ListboxButton className="flex h-full w-full items-center gap-2.5 px-4 text-left transition hover:bg-sky focus:outline-none focus-visible:ring-2 focus-visible:ring-sky">
          <User className="h-5 w-5 shrink-0 text-blue" aria-hidden />
          <span className="truncate text-[15px] font-semibold text-ink">
            {label}
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            portal
            anchor={{ to: "bottom start", gap: "10px", padding: "12px" }}
            className="z-popover min-w-[160px] overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl focus:outline-none"
          >
            {options.map((o) => (
              <ListboxOption
                key={o.value}
                value={o.value}
                className={({ active }) =>
                  cn(
                    "relative cursor-pointer select-none px-4 py-2.5 pr-10 text-sm text-ink",
                    active && "bg-sky"
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span className={cn(selected && "font-semibold text-blue")}>
                      {o.label}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 right-3 flex items-center text-blue">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}

function MobileSearchSheet({
  open,
  onClose,
  checkIn,
  checkOut,
  guests,
  guestOptions,
  onDates,
  onGuests,
  onDone,
  doneLabel,
}: {
  open: boolean;
  onClose: () => void;
  checkIn: Date;
  checkOut: Date;
  guests: string;
  guestOptions: { value: string; label: string }[];
  onDates: (from?: Date, to?: Date) => void;
  onGuests: (v: string) => void;
  onDone: () => void;
  doneLabel: string;
}) {
  const { t } = useI18n();
  const today = startOfDay(new Date());
  const [draftFrom, setDraftFrom] = useState(checkIn);
  const [draftTo, setDraftTo] = useState(checkOut);

  useEffect(() => {
    if (open) {
      setDraftFrom(checkIn);
      setDraftTo(checkOut);
    }
  }, [open, checkIn, checkOut]);

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from) return;
    const fromDay = startOfDay(range.from);
    const toDay = range.to ? startOfDay(range.to) : undefined;
    if (!toDay || isSameDay(fromDay, toDay)) {
      setDraftFrom(fromDay);
      setDraftTo(addDays(fromDay, 1));
      onDates(fromDay, addDays(fromDay, 1));
      return;
    }
    setDraftFrom(fromDay);
    setDraftTo(toDay);
    onDates(fromDay, toDay);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-popover flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="relative rounded-t-3xl bg-white px-4 pb-safe pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
        <p className="mb-2 text-sm font-bold text-ink">{t("avail.dates")}</p>
        <DayPicker
          mode="range"
          selected={{ from: draftFrom, to: draftTo }}
          onSelect={handleSelect}
          numberOfMonths={1}
          disabled={{ before: today }}
          showOutsideDays
          className="tkh-day-picker"
        />
        <p className="mb-2 mt-4 text-sm font-bold text-ink">
          {t("avail.guests")}
        </p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {guestOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onGuests(o.value)}
              className={cn(
                "rounded-xl border py-3 text-sm font-bold",
                guests === o.value
                  ? "border-blue bg-sky text-blue"
                  : "border-line text-ink"
              )}
            >
              {o.value}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onDone}
          className="btn-primary mb-3 w-full"
        >
          {doneLabel}
        </button>
      </motion.div>
    </div>
  );
}
