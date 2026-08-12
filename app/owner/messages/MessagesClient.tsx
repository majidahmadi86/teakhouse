"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";
import {
  CONTACT_PURPOSES,
  type ContactMessage,
  type ContactPurpose,
} from "@/lib/contactMessages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PURPOSE_LABEL: Record<ContactPurpose, string> = {
  stay: "A stay",
  dining: "Dining",
  event: "An event",
  other: "Something else",
};

const PURPOSE_STYLE: Record<ContactPurpose, string> = {
  stay: "bg-own-blue/20 text-own-blue",
  dining: "bg-gold/20 text-gold",
  event: "bg-deal/20 text-deal",
  other: "bg-white/10 text-white/60",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  read: "Read",
  done: "Done",
};

/**
 * Messages · what the contact form now produces. Before v14 the form showed a
 * toast and dropped the message on the floor, so this is the first place those
 * enquiries have ever landed.
 *
 * Filtering is by purpose because that is the question the house actually asks
 * ("anything about events today?"), and the purpose-specific fields render only
 * when the guest was asked for them.
 */
export default function OwnerMessagesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<ContactMessage[] | null>(null);
  const [filter, setFilter] = useState<"all" | ContactPurpose>("all");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/contact", { cache: "no-store" });
      setRows(res.ok ? ((await res.json()) as ContactMessage[]) : []);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const shown = useMemo(
    () => (rows ?? []).filter((m) => filter === "all" || m.purpose === filter),
    [rows, filter]
  );
  const unread = (rows ?? []).filter((m) => m.status === "new").length;

  async function setStatus(row: ContactMessage, status: string) {
    setRows((prev) =>
      prev
        ? prev.map((m) =>
            m.id === row.id ? { ...m, status: status as ContactMessage["status"] } : m
          )
        : prev
    );
    const res = await fetch(`/api/contact/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) await refresh();
  }

  if (rows === null) return <OwnerSkeleton />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.messages")}
          {unread > 0 ? (
            <span className="ml-3 rounded-full bg-gold/20 px-3 py-1 align-middle text-sm font-extrabold text-gold">
              {unread} new
            </span>
          ) : null}
        </h1>
        <div className="owner-inset flex flex-wrap rounded-xl p-1">
          {(["all", ...CONTACT_PURPOSES] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                "min-h-[40px] rounded-lg px-3 text-sm font-bold transition",
                filter === key
                  ? "bg-own-blue text-white"
                  : "text-white/60 hover:text-white"
              )}
            >
              {key === "all" ? "All" : PURPOSE_LABEL[key]}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-white/55">Nothing here yet.</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((m) => (
            <li
              key={m.id}
              className={cn(
                "owner-panel rounded-2xl p-5 md:p-6",
                m.status === "done" && "opacity-60"
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-extrabold",
                    PURPOSE_STYLE[m.purpose]
                  )}
                >
                  {PURPOSE_LABEL[m.purpose]}
                </span>
                <span className="text-sm font-bold text-white">{m.name}</span>
                <span className="text-xs text-white/55">{m.contact}</span>
                <span className="ml-auto text-xs text-white/40">
                  {format(parseISO(m.createdAt), "d MMM yyyy · HH:mm")}
                </span>
                <div className="w-[130px] shrink-0">
                  <OwnerListbox
                    value={m.status}
                    onChange={(v) => setStatus(m, v)}
                    options={["new", "read", "done"].map((s) => ({
                      value: s,
                      label: STATUS_LABEL[s],
                    }))}
                  />
                </div>
              </div>

              {m.checkIn || m.date ? (
                <p className="mb-2 text-xs font-bold text-own-blue">
                  {m.checkIn ? (
                    <>
                      {format(parseISO(m.checkIn), "d MMM yyyy")}
                      {m.checkOut
                        ? ` to ${format(parseISO(m.checkOut), "d MMM yyyy")}`
                        : ""}
                    </>
                  ) : null}
                  {m.date ? format(parseISO(m.date), "d MMM yyyy") : null}
                  {m.party ? ` · ${m.party} guests` : ""}
                </p>
              ) : null}

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                {m.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
