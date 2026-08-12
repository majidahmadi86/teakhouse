"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClock, Loader2 } from "lucide-react";
import { ImageUploadField } from "@/components/owner/ImageUploadField";
import { OwnerListbox } from "@/components/owner/OwnerField";
import type { HotelDto } from "@/lib/ownerTypes";
import {
  RESERVATION_STATUSES,
  serviceSlots,
  type ReservationStatus,
  type TableReservation,
} from "@/lib/reservations";
import { cn, isoDate } from "@/lib/utils";

const STATUS_STYLE: Record<ReservationStatus, string> = {
  pending: "bg-gold/20 text-gold",
  confirmed: "bg-own-blue/20 text-own-blue",
  seated: "bg-deal/20 text-deal",
  cancelled: "bg-white/10 text-white/50",
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Seated",
  cancelled: "Cancelled",
};

const TIME_CHOICES = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return res.ok;
}

/**
 * Reservations · the list the house works from, plus the three settings that
 * shape the guest form (on/off, service window, party cap) and the two page
 * hero uploads. Settings live on the hotel row, so they save through
 * /api/hotel like everything else in Settings.
 *
 * The list shows upcoming covers first and keeps past days behind a toggle:
 * the useful question at service time is "who is coming tonight", not "who
 * came in March".
 */
export function ReservationsPanel() {
  const [rows, setRows] = useState<TableReservation[] | null>(null);
  const [hotel, setHotel] = useState<HotelDto | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [showPast, setShowPast] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [rRes, hRes] = await Promise.all([
        fetch("/api/reservations", { cache: "no-store" }),
        fetch("/api/hotel", { cache: "no-store" }),
      ]);
      setRows(rRes.ok ? ((await rRes.json()) as TableReservation[]) : []);
      if (hRes.ok) setHotel((await hRes.json()) as HotelDto);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const today = isoDate(new Date());
  const { upcoming, past } = useMemo(() => {
    const all = rows ?? [];
    return {
      upcoming: all.filter((r) => r.date >= today),
      past: all.filter((r) => r.date < today).reverse(),
    };
  }, [rows, today]);

  const pendingCount = upcoming.filter((r) => r.status === "pending").length;

  async function setStatus(row: TableReservation, status: ReservationStatus) {
    setRows((prev) =>
      prev
        ? prev.map((r) => (r.id === row.id ? { ...r, status } : r))
        : prev
    );
    const ok = await jsonFetch(`/api/reservations/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!ok) await refresh();
  }

  async function saveSettings(patch: Partial<HotelDto>) {
    if (!hotel) return;
    setSavingSettings(true);
    setSettingsMsg("");
    const next = { ...hotel, ...patch };
    setHotel(next);
    try {
      const res = await fetch("/api/hotel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setSettingsMsg("Save failed");
        await refresh();
        return;
      }
      setHotel((await res.json()) as HotelDto);
      setSettingsMsg("Saved");
    } finally {
      setSavingSettings(false);
    }
  }

  const slotCount = hotel
    ? serviceSlots(hotel.serviceStart, hotel.serviceEnd).length
    : 0;

  return (
    <section className="space-y-6">
      {/* Settings */}
      <div className="owner-panel rounded-2xl p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-white">
            Table reservations
          </h2>
          <div className="flex items-center gap-3">
            {savingSettings ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/50" aria-hidden />
            ) : settingsMsg ? (
              <span className="text-xs font-semibold text-white/50">
                {settingsMsg}
              </span>
            ) : null}
            <span className="text-sm font-bold text-white/70">
              {hotel?.reservationsEnabled ? "Taking bookings" : "Switched off"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(hotel?.reservationsEnabled)}
              aria-label="Accept table reservations"
              disabled={!hotel}
              onClick={() =>
                saveSettings({ reservationsEnabled: !hotel?.reservationsEnabled })
              }
              className={cn(
                "relative h-7 w-12 rounded-full transition disabled:opacity-40",
                hotel?.reservationsEnabled ? "bg-deal" : "bg-white/20"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                  hotel?.reservationsEnabled ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>
        </div>

        <p className="mb-6 text-sm text-white/55">
          {hotel?.reservationsEnabled
            ? `Guests can request a table on the dining page · ${slotCount} sittings per day.`
            : "The reserve-a-table button is hidden across the site while this is off."}
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="mb-2 text-sm font-semibold text-white/80">
              Service starts
            </div>
            <OwnerListbox
              value={hotel?.serviceStart ?? "11:30"}
              onChange={(v) => saveSettings({ serviceStart: v })}
              options={TIME_CHOICES.map((t) => ({ value: t, label: t }))}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-white/80">
              Kitchen closes
            </div>
            <OwnerListbox
              value={hotel?.serviceEnd ?? "22:00"}
              onChange={(v) => saveSettings({ serviceEnd: v })}
              options={TIME_CHOICES.map((t) => ({ value: t, label: t }))}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-white/80">
              Largest party
            </div>
            <OwnerListbox
              value={String(hotel?.maxPartySize ?? 10)}
              onChange={(v) => saveSettings({ maxPartySize: Number(v) })}
              options={Array.from({ length: 20 }, (_, i) => i + 1).map((n) => ({
                value: String(n),
                label: n === 1 ? "1 guest" : `${n} guests`,
              }))}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-white/45">
          The last sitting is one hour before the kitchen closes.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <ImageUploadField
            label="Dining page hero"
            value={hotel?.diningHeroImage ?? ""}
            folder="page-heroes"
            onChange={(url) => saveSettings({ diningHeroImage: url })}
            hint="Wide crop · replaces the food hero at the top of /dining."
          />
          <ImageUploadField
            label="Events page hero"
            value={hotel?.eventsHeroImage ?? ""}
            folder="page-heroes"
            onChange={(url) => saveSettings({ eventsHeroImage: url })}
            hint="Wide crop · replaces the pavilion hero at the top of /events."
          />
        </div>
      </div>

      {/* The list */}
      <div className="owner-panel rounded-2xl p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold text-white">
            <CalendarClock className="h-5 w-5 text-own-blue" aria-hidden />
            Upcoming tables
            {pendingCount > 0 ? (
              <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-extrabold text-gold">
                {pendingCount} to confirm
              </span>
            ) : null}
          </h3>
          {past.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              className="owner-control min-h-[44px] rounded-xl px-4 text-sm font-bold text-white/70 transition hover:text-white"
            >
              {showPast ? "Hide past" : `Past (${past.length})`}
            </button>
          ) : null}
        </div>

        {rows === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-white/40" aria-hidden />
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-white/55">No tables booked yet.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((row) => (
              <ReservationRow key={row.id} row={row} onStatus={setStatus} />
            ))}
          </ul>
        )}

        {showPast && past.length > 0 ? (
          <ul className="mt-6 space-y-3 opacity-60">
            {past.map((row) => (
              <ReservationRow key={row.id} row={row} onStatus={setStatus} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function ReservationRow({
  row,
  onStatus,
}: {
  row: TableReservation;
  onStatus: (row: TableReservation, status: ReservationStatus) => void;
}) {
  return (
    <li className="owner-inset flex flex-wrap items-center gap-4 rounded-xl px-4 py-3">
      <div className="w-[104px] shrink-0">
        <p className="text-sm font-extrabold text-white">
          {format(parseISO(row.date), "EEE d MMM")}
        </p>
        <p className="text-xs font-bold text-own-blue">{row.time}</p>
      </div>

      <div className="w-[76px] shrink-0">
        <p className="font-display text-xl font-semibold text-white">
          {row.party}
        </p>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/45">
          {row.party === 1 ? "guest" : "guests"}
        </p>
      </div>

      <div className="min-w-[160px] flex-1">
        <p className="truncate text-sm font-bold text-white">{row.name}</p>
        <p className="truncate text-xs text-white/55">
          {row.contactKind === "line" ? "LINE " : ""}
          {row.contact}
        </p>
        {row.notes ? (
          <p className="mt-1 truncate text-xs italic text-white/45">
            {row.notes}
          </p>
        ) : null}
      </div>

      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-extrabold",
          STATUS_STYLE[row.status]
        )}
      >
        {row.ref}
      </span>

      <div className="w-[150px] shrink-0">
        <OwnerListbox
          value={row.status}
          onChange={(v) => onStatus(row, v as ReservationStatus)}
          options={RESERVATION_STATUSES.map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
        />
      </div>
    </li>
  );
}
