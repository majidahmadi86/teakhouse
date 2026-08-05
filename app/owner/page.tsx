"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import {
  type Booking,
  type CellState,
  useOwner,
} from "@/lib/ownerStore";
import { addDays, cn, formatBaht, isoDate } from "@/lib/utils";

function bookingTouchesMonth(booking: Booking, ref: Date): boolean {
  if (booking.status === "cancelled") return false;
  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const inDate = new Date(booking.checkIn + "T12:00:00");
  const outDate = new Date(booking.checkOut + "T12:00:00");
  return inDate <= monthEnd && outDate > monthStart;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function cellColor(state: CellState): string {
  if (state === "booked") return "bg-own-blue";
  if (state === "blocked") return "bg-white/15";
  return "bg-deal/40";
}

export default function OwnerDashboardPage() {
  const { t, tr } = useI18n();
  const {
    data,
    getCell,
    occupancyTonight,
    arrivalsToday,
    directCountMonth,
    otaSavedMonth,
  } = useOwner();

  const occ = occupancyTonight();
  const directPct = directCountMonth();
  const otaSaved = otaSavedMonth();
  const animatedOta = useCountUp(otaSaved);

  const channelMix = useMemo(() => {
    const now = new Date();
    const monthBookings = data.bookings.filter((b) =>
      bookingTouchesMonth(b, now)
    );
    if (monthBookings.length === 0) return { direct: 62, ota: 38 };
    const direct = monthBookings.filter((b) => b.source === "Direct").length;
    const directPctVal = Math.round((direct / monthBookings.length) * 100);
    return { direct: directPctVal, ota: 100 - directPctVal };
  }, [data.bookings]);

  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const activeRooms = data.rooms.filter((r) => r.active);

  return (
    <div>
      <header className="mb-10">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
          {t("ow.eyebrow")}
        </p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
          {t("ow.h1")}
        </h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">
          {t("ow.lead")}
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatCard label={t("ow.s1")}>
          <span className="font-display text-4xl font-semibold text-white">
            {occ.occupied}
            <small className="text-xl text-white/50">/{occ.total}</small>
          </span>
        </StatCard>

        <StatCard label={t("ow.s2")}>
          <span className="font-display text-4xl font-semibold text-white">
            {arrivalsToday()}
          </span>
        </StatCard>

        <StatCard label={t("ow.s3")}>
          <span className="font-display text-4xl font-semibold text-deal">
            {directPct}%
          </span>
        </StatCard>

        <StatCard label={t("ow.s4")} gold sub={t("ow.s4sub")}>
          <span className="font-display text-4xl font-semibold text-white">
            {formatBaht(animatedOta)}
          </span>
        </StatCard>
      </div>

      <section className="owner-panel mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-white">
          {t("ow.mix")}
        </h2>
        <div className="flex h-4 overflow-hidden rounded-full">
          <div
            className="bg-deal transition-all duration-700"
            style={{ width: `${channelMix.direct}%` }}
          />
          <div
            className="bg-gold transition-all duration-700"
            style={{ width: `${channelMix.ota}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-6 text-sm font-bold">
          <span className="text-deal">
            {t("ow.direct")} {channelMix.direct}%
          </span>
          <span className="text-gold">
            {t("ow.ota")} {channelMix.ota}%
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-white/60">{t("ow.mixnote")}</p>
      </section>

      <section className="owner-panel rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <h2 className="mb-6 font-display text-xl font-semibold text-white">
          {t("ow.next7")}
        </h2>

        <div className="overflow-x-auto">
          <div
            className="grid gap-1 text-xs font-bold"
            style={{
              gridTemplateColumns: `minmax(100px, 140px) repeat(7, minmax(36px, 1fr))`,
            }}
          >
            <div />
            {days.map((d) => (
              <div
                key={isoDate(d)}
                className="py-2 text-center text-white/50"
              >
                {format(d, "d")}
                <br />
                <span className="text-[0.65rem] font-semibold uppercase">
                  {format(d, "EEE")}
                </span>
              </div>
            ))}

            {activeRooms.map((room) => (
              <Fragment key={room.slug}>
                <div className="flex items-center py-2 pr-2 text-sm font-bold text-white/80">
                  {tr(room.name)}
                </div>
                {days.map((d) => {
                  const dateIso = isoDate(d);
                  const state = getCell(room.slug, dateIso);
                  return (
                    <div
                      key={`${room.slug}-${dateIso}`}
                      title={`${tr(room.name)} · ${format(d, "d MMM")} · ${state}`}
                      className={cn(
                        "aspect-square min-h-[36px] min-w-[36px] rounded-md",
                        cellColor(state)
                      )}
                      aria-label={`${tr(room.name)} ${format(d, "d MMM")} ${state}`}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-white/80">
          <LegendDot color="bg-deal/40" label={t("ow.lg1")} />
          <LegendDot color="bg-own-blue" label={t("ow.lg2")} />
          <LegendDot color="bg-white/15" label={t("ow.lg3")} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  children,
  gold,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  gold?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 md:p-6",
        gold
          ? "border-gold/40 bg-gold/15 text-white"
          : "border-white/12 bg-white/[0.05]"
      )}
    >
      <b
        className={cn(
          "mb-3 block text-[0.68rem] font-extrabold uppercase tracking-[0.16em]",
          gold ? "text-gold" : "text-own-blue"
        )}
      >
        {label}
      </b>
      {children}
      {sub ? (
        <p
          className={cn(
            "mt-2 text-xs font-semibold",
            gold ? "text-gold/80" : "text-white/50"
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <i className={cn("inline-block h-3 w-3 rounded", color)} aria-hidden />
      {label}
    </span>
  );
}
