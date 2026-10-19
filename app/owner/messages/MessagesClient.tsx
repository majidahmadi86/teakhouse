"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";
import {
  CONTACT_PURPOSES,
  type ContactMessage,
  type ContactPurpose,
} from "@/lib/contactMessages";
import { useI18n } from "@/lib/i18n";
import { ownerFetch } from "@/lib/ownerSessionClient";
import { useToast } from "@/components/owner/OwnerUI";
import { InfoTip } from "@/components/owner/InfoTip";
import { cn } from "@/lib/utils";
import { dfLocale } from "@/lib/dateLocale";

/** Reuses the guest form's own purpose labels · same words, same meaning. */
const PURPOSE_LABEL: Record<ContactPurpose, string> = {
  stay: "ct.aboutStay",
  dining: "ct.aboutDining",
  event: "ct.aboutEvent",
  other: "ct.aboutOther",
};

const PURPOSE_STYLE: Record<ContactPurpose, string> = {
  stay: "bg-own-blue/20 text-own-blue",
  dining: "bg-gold/20 text-gold",
  event: "bg-deal/20 text-deal",
  other: "bg-white/10 text-white/60",
};

const STATUS_LABEL: Record<string, string> = {
  new: "ow.stNew",
  read: "ow.stRead",
  done: "ow.stDone",
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
  const { t, lang } = useI18n();
  const dfl = dfLocale(lang);
  const toast = useToast();
  const [rows, setRows] = useState<ContactMessage[] | null>(null);
  const [filter, setFilter] = useState<"all" | ContactPurpose>("all");
  const [query, setQuery] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      // v18 · owner-only (names, contact details).
      const res = await ownerFetch("/api/contact", { cache: "no-store" });
      setLoadFailed(!res.ok);
      setRows(res.ok ? ((await res.json()) as ContactMessage[]) : []);
    } catch {
      setLoadFailed(true);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((m) => {
      if (filter !== "all" && m.purpose !== filter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.contact.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);
  const unread = (rows ?? []).filter((m) => m.status === "new").length;

  async function setStatus(row: ContactMessage, status: string) {
    setRows((prev) =>
      prev
        ? prev.map((m) =>
            m.id === row.id ? { ...m, status: status as ContactMessage["status"] } : m
          )
        : prev
    );
    let ok = false;
    try {
      const res = await ownerFetch(`/api/contact/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (ok) toast(t("ow.msg.statusSaved", { name: row.name, status: t(STATUS_LABEL[status] ?? "ow.stNew") }));
    else {
      toast(t("ow.ui.saveFailed"), "error");
      await refresh();
    }
  }

  if (rows === null) return <OwnerSkeleton />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.messages")}
          {unread > 0 ? (
            <span className="ml-3 rounded-full bg-gold/20 px-3 py-1 align-middle text-sm font-extrabold text-gold">
              {t("ow.newCount", { n: unread })}
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
              {key === "all" ? t("ow.filterAll") : t(PURPOSE_LABEL[key])}
            </button>
          ))}
        </div>
      </div>

      <div className="owner-panel mb-6 rounded-2xl p-4">
        <label className="relative block">
          <span className="sr-only">{t("ow.msg.search")}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ow.msg.search")}
            className="min-h-[44px] w-full py-3 pl-11 pr-4 text-base"
          />
        </label>
      </div>

      {loadFailed ? (
        <div className="owner-panel mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
          <p className="text-sm font-semibold text-red-300">{t("ow.ui.loadFailed")}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="owner-control min-h-[44px] rounded-xl px-4 text-sm font-bold text-white"
          >
            {t("ow.ui.retry")}
          </button>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="text-sm text-white/55">
          {query.trim() ? t("ow.msg.noMatch") : t("ow.nothingHere")}
        </p>
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
                  {t(PURPOSE_LABEL[m.purpose])}
                </span>
                <span className="text-sm font-bold text-white">{m.name}</span>
                <span className="text-xs text-white/55">{m.contact}</span>
                <span className="ml-auto text-xs text-white/40">
                  {format(parseISO(m.createdAt), "d MMM yyyy · HH:mm", dfl)}
                </span>
                <div className="flex w-[160px] shrink-0 items-center gap-1.5">
                  <InfoTip variant="help" label={t("col.st")} text={t("ow.tip.messages.status")} />
                  <OwnerListbox
                    className="flex-1"
                    value={m.status}
                    onChange={(v) => setStatus(m, v)}
                    options={["new", "read", "done"].map((s) => ({
                      value: s,
                      label: t(STATUS_LABEL[s]),
                    }))}
                  />
                </div>
              </div>

              {m.checkIn || m.date ? (
                <p className="mb-2 text-xs font-bold text-own-blue">
                  {m.checkIn ? (
                    <>
                      {format(parseISO(m.checkIn), "d MMM yyyy", dfl)}
                      {m.checkOut
                        ? ` ${t("ow.msgTo")} ${format(parseISO(m.checkOut), "d MMM yyyy", dfl)}`
                        : ""}
                    </>
                  ) : null}
                  {m.date ? format(parseISO(m.date), "d MMM yyyy", dfl) : null}
                  {m.party ? ` · ${m.party === 1 ? t("ow.guestOne") : t("ow.guestCount", { n: m.party })}` : ""}
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
