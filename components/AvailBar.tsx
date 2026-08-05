"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ListboxField } from "@/components/ui/ListboxField";
import { useI18n } from "@/lib/i18n";
import { addDays, isoDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type AvailBarProps = {
  className?: string;
  showNote?: boolean;
};

export function AvailBar({ className, showNote = true }: AvailBarProps) {
  const { t } = useI18n();
  const router = useRouter();

  const [checkIn, setCheckIn] = useState<Date>(() => addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(() => addDays(new Date(), 2));
  const [guests, setGuests] = useState("2");

  const guestOptions = useMemo(
    () =>
      ["1", "2", "3", "4"].map((n) => ({
        value: n,
        label: t(`g${n}` as "g1"),
      })),
    [t]
  );

  function handleDates(from?: Date, to?: Date) {
    if (from) setCheckIn(from);
    if (to) setCheckOut(to);
    if (from && !to) setCheckOut(addDays(from, 1));
  }

  function goBook() {
    const params = new URLSearchParams();
    params.set("in", isoDate(checkIn));
    params.set("out", isoDate(checkOut));
    params.set("g", guests);
    router.push(`/book?${params.toString()}`);
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-[18px] bg-white text-ink shadow-panel">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_auto]">
          <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
            <div className="mb-1 text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-gold">
              {t("avail.dates")}
            </div>
            <DateRangePicker
              from={checkIn}
              to={checkOut}
              onChange={handleDates}
              placeholder={t("avail.selectDates")}
              numberOfMonths={1}
            />
          </div>
          <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
            <ListboxField
              label={t("avail.guests")}
              value={guests}
              onChange={setGuests}
              options={guestOptions}
            />
          </div>
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={goBook}
              className="w-full bg-brand px-8 py-4 text-[0.95rem] font-extrabold text-white transition hover:bg-brand-2 lg:py-0"
            >
              {t("avail.go")}
            </button>
          </div>
        </div>
      </div>
      {showNote ? (
        <p className="mt-3 text-center text-[0.8rem] font-semibold text-white/85 max-lg:text-strike">
          {t("avail.note")}
        </p>
      ) : null}
    </div>
  );
}
