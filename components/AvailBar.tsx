"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ListboxField } from "@/components/ui/ListboxField";
import { useI18n } from "@/lib/i18n";
import { addDays, cn, isoDate } from "@/lib/utils";

type AvailBarProps = {
  className?: string;
  showNote?: boolean;
  variant?: "default" | "hero";
};

export function AvailBar({
  className,
  showNote = true,
  variant = "default",
}: AvailBarProps) {
  const { t } = useI18n();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [pulse, setPulse] = useState(false);

  const [checkIn, setCheckIn] = useState<Date | undefined>(() =>
    addDays(new Date(), 1)
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(() =>
    addDays(new Date(), 2)
  );
  const [guests, setGuests] = useState("2");

  useEffect(() => {
    if (variant !== "hero" || reduce) return;
    setPulse(true);
    const tmr = setTimeout(() => setPulse(false), 2400);
    return () => clearTimeout(tmr);
  }, [variant, reduce]);

  const guestOptions = useMemo(
    () =>
      ["1", "2", "3", "4"].map((n) => ({
        value: n,
        label: t(`g${n}` as "g1"),
      })),
    [t]
  );

  function handleDates(from?: Date, to?: Date) {
    setCheckIn(from);
    setCheckOut(to);
  }

  function goBook() {
    const params = new URLSearchParams();
    const inDate = checkIn ?? addDays(new Date(), 1);
    const outDate = checkOut ?? addDays(inDate, 1);
    params.set("in", isoDate(inDate));
    params.set("out", isoDate(outDate));
    params.set("g", guests);
    router.push(`/book?${params.toString()}`);
  }

  const isHero = variant === "hero";
  const labelClass = isHero
    ? "mb-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-sub"
    : "mb-1 text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-sub";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "overflow-hidden bg-white text-ink shadow-2xl",
          isHero
            ? "rounded-2xl border-t border-blue"
            : "rounded-[18px] shadow-panel"
        )}
      >
        <div
          className={cn(
            "grid grid-cols-1",
            isHero
              ? "md:grid-cols-[1.2fr_1fr_auto]"
              : "sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_auto]"
          )}
        >
          <div
            className={cn(
              "border-line p-4 md:p-5",
              isHero
                ? "border-b md:border-b-0 md:border-r"
                : "border-b lg:border-b-0 lg:border-r"
            )}
          >
            <div className={labelClass}>{t("avail.dates")}</div>
            <DateRangePicker
              from={checkIn}
              to={checkOut}
              onChange={handleDates}
              placeholder={t("avail.selectDates")}
              numberOfMonths={1}
            />
          </div>
          <div
            className={cn(
              "border-line p-4 md:p-5",
              isHero
                ? "border-b md:border-b-0 md:border-r"
                : "border-b lg:border-b-0 lg:border-r"
            )}
          >
            <ListboxField
              label={t("avail.guests")}
              labelClassName={labelClass}
              value={guests}
              onChange={setGuests}
              options={guestOptions}
            />
          </div>
          <div className="flex items-stretch p-3 md:p-0">
            <button
              type="button"
              onClick={goBook}
              className={cn(
                "w-full rounded-xl bg-blue px-8 text-[0.95rem] font-extrabold text-white transition hover:bg-blue-dark md:rounded-none",
                isHero ? "h-14 md:h-auto md:min-h-[72px]" : "py-4 lg:py-0 lg:min-h-[72px]",
                pulse && "avail-pulse"
              )}
            >
              {t("avail.go")}
            </button>
          </div>
        </div>
      </div>
      {showNote ? (
        <p
          className={cn(
            "mt-3 text-center text-[0.8rem] font-semibold max-lg:text-strike",
            isHero ? "text-white/90" : "text-white/85 max-lg:text-strike"
          )}
        >
          {t("avail.note")}
        </p>
      ) : null}
    </div>
  );
}
