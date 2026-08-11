"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useI18n } from "@/lib/i18n";
import {
  type Booking,
  type CellState,
  useOwner,
} from "@/lib/ownerStore";
import { addDays, cn, formatBaht, isoDate, nightsBetween } from "@/lib/utils";
import { OwnerRise, OwnerStagger } from "@/components/owner/OwnerMotion";

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

function monthKey(d: Date): string {
  return format(d, "yyyy-MM");
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return format(new Date(y, m - 1, 1), "MMM");
}

/** Allocate booking amount across stay months by night share. */
function revenueByMonth(
  bookings: Booking[],
  months: string[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of months) out[k] = 0;

  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const nights = nightsBetween(b.checkIn, b.checkOut);
    const perNight = b.amount / nights;
    let cursor = parseISO(b.checkIn);
    const end = parseISO(b.checkOut);
    while (cursor < end) {
      const key = monthKey(cursor);
      if (key in out) out[key] += perNight;
      cursor = addDays(cursor, 1);
    }
  }

  for (const k of months) out[k] = Math.round(out[k]);
  return out;
}

function occupancyPctForMonth(
  bookings: Booking[],
  roomCount: number,
  ref: Date
): number {
  if (roomCount === 0) return 0;
  const daysInMonth = new Date(
    ref.getFullYear(),
    ref.getMonth() + 1,
    0
  ).getDate();
  const capacity = roomCount * daysInMonth;
  let occupiedNights = 0;
  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);

  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const inDate = parseISO(b.checkIn);
    const outDate = parseISO(b.checkOut);
    let cursor = inDate > monthStart ? inDate : monthStart;
    const end = outDate < addDays(monthEnd, 1) ? outDate : addDays(monthEnd, 1);
    while (cursor < end) {
      occupiedNights += 1;
      cursor = addDays(cursor, 1);
    }
  }

  return Math.round((occupiedNights / capacity) * 100);
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
  const animatedOcc = useCountUp(occ.occupied);
  const animatedArrivals = useCountUp(arrivalsToday());
  const animatedDirect = useCountUp(directPct);
  const animatedOta = useCountUp(otaSaved);

  const activeRooms = data.rooms.filter((r) => r.active);

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

  const revenue = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d));
    }
    const byMonth = revenueByMonth(data.bookings, months);
    const max = Math.max(1, ...months.map((m) => byMonth[m]));
    const thisMonthKey = monthKey(now);
    const thisMonthRevenue = byMonth[thisMonthKey] ?? 0;
    const monthBookings = data.bookings.filter((b) =>
      bookingTouchesMonth(b, now)
    );
    const roomNights = monthBookings.reduce(
      (sum, b) => sum + nightsBetween(b.checkIn, b.checkOut),
      0
    );
    const adr =
      roomNights > 0 ? Math.round(thisMonthRevenue / roomNights) : 0;
    const occupancyPct = occupancyPctForMonth(
      data.bookings,
      activeRooms.length,
      now
    );

    const sourceCounts: Record<string, number> = {
      Direct: 0,
      Agoda: 0,
      Booking: 0,
    };
    for (const b of monthBookings) {
      sourceCounts[b.source] = (sourceCounts[b.source] ?? 0) + 1;
    }
    const sourceTotal = monthBookings.length || 1;

    return {
      months,
      byMonth,
      max,
      thisMonthRevenue,
      adr,
      occupancyPct,
      sourceCounts,
      sourceTotal,
      bookingCount: monthBookings.length,
    };
  }, [data.bookings, activeRooms.length]);

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

      <OwnerStagger className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <OwnerRise>
          <StatCard label={t("ow.s1")}>
            <span className="font-display text-4xl font-semibold text-white">
              {animatedOcc}
              <small className="text-xl text-white/60">/{occ.total}</small>
            </span>
          </StatCard>
        </OwnerRise>

        <OwnerRise>
          <StatCard label={t("ow.s2")}>
            <span className="font-display text-4xl font-semibold text-white">
              {animatedArrivals}
            </span>
          </StatCard>
        </OwnerRise>

        <OwnerRise>
          <StatCard label={t("ow.s3")}>
            <span className="font-display text-4xl font-semibold text-deal">
              {animatedDirect}%
            </span>
          </StatCard>
        </OwnerRise>

        <OwnerRise>
          <StatCard label={t("ow.s4")} gold sub={t("ow.s4sub")}>
            <span className="font-display text-4xl font-semibold text-white">
              {formatBaht(animatedOta)}
            </span>
          </StatCard>
        </OwnerRise>
      </OwnerStagger>

      {/* Revenue dashboard */}
      <section className="owner-panel mb-6 rounded-2xl  p-6 md:p-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-white">
          Revenue
        </h2>
        <p className="mb-6 text-sm text-white/55">
          Last 6 months · night-weighted booking totals
        </p>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat
            label="This month"
            value={formatBaht(revenue.thisMonthRevenue)}
          />
          <MiniStat label="Occupancy" value={`${revenue.occupancyPct}%`} />
          <MiniStat label="ADR" value={formatBaht(revenue.adr)} />
          <MiniStat
            label="Bookings"
            value={String(revenue.bookingCount)}
          />
        </div>

        <div className="mb-8">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
            Monthly revenue
          </p>
          <div
            className="flex h-40 items-end gap-2 sm:gap-3"
            role="img"
            aria-label="Monthly revenue bar chart"
          >
            {revenue.months.map((key) => {
              const value = revenue.byMonth[key] ?? 0;
              const pct = Math.max(4, (value / revenue.max) * 100);
              return (
                <div
                  key={key}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-[0.65rem] font-bold text-white/60">
                    {value > 0 ? formatBaht(value) : "·"}
                  </span>
                  <div className="flex h-28 w-full items-end justify-center">
                    <div
                      className="w-full max-w-[48px] rounded-t-md bg-own-blue/80 transition-all duration-500"
                      style={{ height: `${pct}%` }}
                      title={`${monthLabel(key)} · ${formatBaht(value)}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-white/70">
                    {monthLabel(key)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
            Bookings by source
          </p>
          <p className="mb-4 text-xs text-white/55">
            Placeholder mix for this month · wire OTA webhooks later
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["Direct", "Agoda", "Booking"] as const).map((src) => {
              const count = revenue.sourceCounts[src] ?? 0;
              const pct = Math.round((count / revenue.sourceTotal) * 100);
              return (
                <div
                  key={src}
                  className="owner-inset rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        src === "Direct" ? "text-deal" : "text-gold"
                      )}
                    >
                      {src}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        src === "Direct" ? "bg-deal" : "bg-gold"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/55">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="owner-panel mb-6 rounded-2xl  p-6 md:p-8">
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

      <section className="owner-panel rounded-2xl  p-6 md:p-8">
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
                className="py-2 text-center text-white/60"
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="owner-inset rounded-xl px-4 py-3">
      <b className="mb-1 block text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-own-blue">
        {label}
      </b>
      <span className="font-display text-2xl font-semibold text-white">
        {value}
      </span>
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
          : "border-white/10 bg-white/[0.05]"
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
            gold ? "text-gold/80" : "text-white/60"
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
