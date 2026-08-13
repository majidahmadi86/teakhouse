"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Ticket } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import {
  EVENT_REQUEST_STATUSES,
  type EventRequest,
  type EventRequestStatus,
} from "@/lib/eventRequests";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { dfLocale } from "@/lib/dateLocale";

const STATUS_STYLE: Record<EventRequestStatus, string> = {
  pending: "bg-gold/20 text-gold",
  confirmed: "bg-deal/20 text-deal",
  declined: "bg-white/10 text-white/50",
};

const STATUS_LABEL: Record<EventRequestStatus, string> = {
  pending: "ow.stPending",
  confirmed: "ow.stConfirmed",
  declined: "ow.stDeclined",
};

/**
 * Seat requests · the list the house works from when an evening is filling up.
 * Grouped visually by event through the event label on each row rather than by
 * nesting, so a request is never hidden inside a collapsed group.
 */
export function RequestsPanel() {
  const { t, tr, lang } = useI18n();
  const dfl = dfLocale(lang);
  const [rows, setRows] = useState<EventRequest[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/event-requests", { cache: "no-store" });
      setRows(res.ok ? ((await res.json()) as EventRequest[]) : []);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setStatus(row: EventRequest, status: EventRequestStatus) {
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === row.id ? { ...r, status } : r)) : prev
    );
    const res = await fetch(`/api/event-requests/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) await refresh();
  }

  const pending = (rows ?? []).filter((r) => r.status === "pending").length;
  const seats = (rows ?? [])
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + r.guests, 0);

  return (
    <section className="owner-panel mb-8 rounded-2xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-white">
          <Ticket className="h-5 w-5 text-own-blue" aria-hidden />
          {t("ow.seatRequests")}
          {pending > 0 ? (
            <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-extrabold text-gold">
              {t("ow.toAnswer", { n: pending })}
            </span>
          ) : null}
        </h2>
        {seats > 0 ? (
          <span className="text-sm font-bold text-white/60">
            {t("ow.seatsConfirmed", { n: seats })}
          </span>
        ) : null}
      </div>

      {rows === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-white/40" aria-hidden />
      ) : rows.length === 0 ? (
        <p className="text-sm text-white/55">{t("ow.noSeatRequests")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                "owner-inset flex flex-wrap items-center gap-4 rounded-xl px-4 py-3",
                row.status === "declined" && "opacity-60"
              )}
            >
              <div className="min-w-[150px] flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {row.eventTitle ? tr(row.eventTitle) : "Event"}
                </p>
                {row.eventDate ? (
                  <p className="text-xs font-bold text-own-blue">
                    {format(parseISO(row.eventDate), "EEE d MMM yyyy", dfl)}
                  </p>
                ) : null}
              </div>

              <div className="w-[70px] shrink-0 text-center">
                <p className="font-display text-xl font-semibold text-white">
                  {row.guests}
                </p>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/45">
                  {t(row.guests === 1 ? "ow.unitSeat" : "ow.unitSeats")}
                </p>
              </div>

              <div className="min-w-[150px] flex-1">
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
                  onChange={(v) => setStatus(row, v as EventRequestStatus)}
                  options={EVENT_REQUEST_STATUSES.map((s) => ({
                    value: s,
                    label: t(STATUS_LABEL[s]),
                  }))}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
