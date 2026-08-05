"use client";

import { Fragment, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { useI18n } from "@/lib/i18n";
import { type CellState, useOwner } from "@/lib/ownerStore";
import { cn, isoDate } from "@/lib/utils";

function cellColor(state: CellState): string {
  if (state === "booked") return "bg-gold cursor-default";
  if (state === "blocked") return "bg-white/15 hover:bg-white/25";
  return "bg-deal/40 hover:bg-deal/60";
}

export default function OwnerCalendarPage() {
  const { t, tr } = useI18n();
  const { data, getCell, toggleBlock } = useOwner();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [roomFilter, setRoomFilter] = useState("all");

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
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 text-white transition hover:border-gold/40"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[140px] text-center font-display text-lg font-semibold text-white">
            {format(month, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 text-white transition hover:border-gold/40"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="owner-panel mb-6 max-w-xs rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <OwnerListbox
          label={t("col.room")}
          value={roomFilter}
          onChange={setRoomFilter}
          options={roomOptions}
        />
      </div>

      <section className="owner-panel overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-6">
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
                className="py-2 text-center text-[0.65rem] font-bold text-white/50"
              >
                {format(d, "d")}
                <br />
                <span className="uppercase">{format(d, "EEE")}</span>
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
                      title={`${tr(room.name)} · ${format(d, "d MMM")} · ${state}`}
                      className={cn(
                        "aspect-square min-h-[28px] min-w-[28px] rounded-sm transition",
                        cellColor(state),
                        isBooked && "opacity-90"
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
          <LegendDot color="bg-gold" label={t("ow.lg2")} />
          <LegendDot color="bg-white/15" label={t("ow.lg3")} />
        </div>
        <p className="mt-3 text-xs font-medium text-white/45">
          Tap available or blocked cells to toggle. Booked nights cannot be changed.
        </p>
      </section>
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
