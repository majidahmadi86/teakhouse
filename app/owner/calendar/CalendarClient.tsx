"use client";

import { Fragment, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { premiumEase } from "@/components/motion/Reveal";
import { useI18n } from "@/lib/i18n";
import { type CellState, useOwner } from "@/lib/ownerStore";
import { cn, isoDate } from "@/lib/utils";
import { dfLocale } from "@/lib/dateLocale";

function cellColor(state: CellState): string {
  if (state === "booked") return "bg-own-blue cursor-default";
  if (state === "blocked") return "bg-white/15 hover:bg-white/25";
  return "bg-deal/40 hover:bg-deal/60";
}

/** Heat intensity from occupancy % (0-100). */
function heatStyle(pct: number): { className: string; style?: React.CSSProperties } {
  if (pct <= 0) {
    return { className: "bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" };
  }
  if (pct < 25) {
    return { className: "bg-own-blue/25" };
  }
  if (pct < 50) {
    return { className: "bg-own-blue/45" };
  }
  if (pct < 75) {
    return { className: "bg-own-blue/70" };
  }
  if (pct < 100) {
    return { className: "bg-own-blue" };
  }
  return { className: "bg-gold" };
}

export default function OwnerCalendarPage() {
  const { t, tr, lang } = useI18n();
  const dfl = dfLocale(lang);
  const { data, getCell, toggleBlock } = useOwner();
  const reduce = useReducedMotion();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [roomFilter, setRoomFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"rooms" | "heat">("rooms");

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      }),
    [month]
  );

  const rooms = useMemo(() => {
    const list = data.rooms.filter((r) => r.active);
    if (roomFilter === "all") return list;
    return list.filter((r) => r.slug === roomFilter);
  }, [data.rooms, roomFilter]);

  const roomOptions = useMemo(
    () => [
      { value: "all", label: t("ow.all") },
      ...data.rooms
        .filter((r) => r.active)
        .map((r) => ({ value: r.slug, label: tr(r.name) })),
    ],
    [data.rooms, t, tr]
  );

  const heatByDay = useMemo(() => {
    const active = data.rooms.filter((r) => r.active);
    const total = active.length || 1;
    const map: Record<string, { pct: number; booked: number }> = {};
    for (const d of days) {
      const dateIso = isoDate(d);
      let booked = 0;
      for (const room of active) {
        if (getCell(room.slug, dateIso) === "booked") booked += 1;
      }
      map[dateIso] = {
        booked,
        pct: Math.round((booked / total) * 100),
      };
    }
    return map;
  }, [days, data.rooms, getCell]);

  function prevMonth() {
    setMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  function nextMonth() {
    setMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  function handleCellClick(roomSlug: string, dateIso: string) {
    const state = getCell(roomSlug, dateIso);
    if (state === "booked") return;
    toggleBlock(roomSlug, dateIso);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.cal")}
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="owner-control flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[140px] text-center font-display text-lg font-semibold text-white">
            {format(month, "MMMM yyyy", dfl)}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="owner-control flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white transition"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="owner-panel mb-6 flex flex-col gap-4 rounded-2xl  p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xs flex-1">
          <OwnerListbox
            label={t("col.room")}
            value={roomFilter}
            onChange={setRoomFilter}
            options={roomOptions}
          />
        </div>
        <div
          className="owner-inset flex rounded-xl p-1"
          role="group"
          aria-label="Calendar view mode"
        >
          <button
            type="button"
            onClick={() => setViewMode("rooms")}
            className={cn(
              "min-h-[40px] rounded-lg px-4 text-sm font-bold transition",
              viewMode === "rooms"
                ? "bg-own-blue text-white"
                : "text-white/60 hover:text-white"
            )}
          >
            {t("ow.calRooms")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("heat")}
            className={cn(
              "min-h-[40px] rounded-lg px-4 text-sm font-bold transition",
              viewMode === "heat"
                ? "bg-own-blue text-white"
                : "text-white/60 hover:text-white"
            )}
          >
            {t("ow.calHeat")}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewMode}
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={reduce ? undefined : { opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: premiumEase }}
          className="overflow-hidden"
        >
      {viewMode === "heat" ? (
        <section className="owner-panel overflow-hidden rounded-2xl  p-4 md:p-6">
          <p className="mb-4 text-sm text-white/55">
            Occupancy heat · darker = fuller house that night
          </p>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-white/55"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: startOfMonth(month).getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((d) => {
              const dateIso = isoDate(d);
              const heat = heatByDay[dateIso] ?? { pct: 0, booked: 0 };
              const style = heatStyle(heat.pct);
              return (
                <div
                  key={dateIso}
                  title={`${format(d, "d MMM", dfl)} · ${heat.pct}% · ${heat.booked}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-xl transition",
                    style.className
                  )}
                >
                  <span className="text-sm font-bold text-white">
                    {format(d, "d")}
                  </span>
                  <span className="text-[0.65rem] font-semibold text-white/70">
                    {heat.pct}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold text-white/70">
            <span className="text-white/55">Intensity</span>
            <LegendDot color="bg-white/[0.06]" label="0%" />
            <LegendDot color="bg-own-blue/25" label="1-24%" />
            <LegendDot color="bg-own-blue/45" label="25-49%" />
            <LegendDot color="bg-own-blue/70" label="50-74%" />
            <LegendDot color="bg-own-blue" label="75-99%" />
            <LegendDot color="bg-gold" label="100%" />
          </div>
        </section>
      ) : (
        <section className="owner-panel overflow-hidden rounded-2xl  p-4 md:p-6">
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[640px] gap-1"
              style={{
                gridTemplateColumns: `minmax(120px, 160px) repeat(${days.length}, minmax(28px, 1fr))`,
              }}
            >
              <div />
              {days.map((d) => (
                <div
                  key={isoDate(d)}
                  className="py-2 text-center text-[0.65rem] font-bold text-white/60"
                >
                  {format(d, "d")}
                  <br />
                  <span className="uppercase">{format(d, "EEE", dfl)}</span>
                </div>
              ))}

              {rooms.map((room) => (
                <Fragment key={room.slug}>
                  <div className="flex items-center py-1 pr-2 text-sm font-bold text-white/80">
                    {tr(room.name)}
                  </div>
                  {days.map((d) => {
                    const dateIso = isoDate(d);
                    const state = getCell(room.slug, dateIso);
                    const isBooked = state === "booked";
                    return (
                      <button
                        key={`${room.slug}-${dateIso}`}
                        type="button"
                        disabled={isBooked}
                        onClick={() => handleCellClick(room.slug, dateIso)}
                        title={`${tr(room.name)} · ${format(d, "d MMM", dfl)} · ${state}`}
                        className={cn(
                          "aspect-square min-h-[28px] min-w-[28px] rounded-sm transition",
                          cellColor(state),
                          isBooked && "opacity-90"
                        )}
                        aria-label={`${tr(room.name)} ${format(d, "d MMM", dfl)} ${state}`}
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
          <p className="mt-3 text-xs font-medium text-white/55">
            {t("ow.calHint")}
          </p>
        </section>
      )}
        </motion.div>
      </AnimatePresence>
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
