"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import type { ChannelDto } from "@/lib/channels/registry";
import { useI18n } from "@/lib/i18n";
import { useOwner } from "@/lib/ownerStore";
import { useStaff } from "@/lib/staffSession";
import { addDays, cn, hotelToday, isoDate } from "@/lib/utils";

/**
 * v15 · Channel manager · what is connected, how each room maps, what has
 * been pushed and what has arrived. "Send a test reservation" runs a signed
 * event through the real inbound path, so an owner can watch the
 * double-booking guard refuse the second one for the same last unit.
 */

type Kind = { kind: string; label: string; commission: number };
type Log = {
  outbox: { id: string; type: string; key: string; status: string; attempts: number; lastError: string; createdAt: string; sentAt: string | null; payload: { reason?: string; dates?: string[]; roomSlug?: string } }[];
  inbound: { id: string; channel: string; externalId: string; type: string; status: string; error: string; createdAt: string }[];
};

export default function ChannelsClient() {
  const { t, tr } = useI18n();
  const { data } = useOwner();
  const { can } = useStaff();
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [log, setLog] = useState<Log | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; text: string; tone: "ok" | "bad" } | null>(null);
  const [newKind, setNewKind] = useState("booking.com");
  const editable = can("channels:write");

  const load = useCallback(async () => {
    const [c, l] = await Promise.all([
      fetch("/api/channels", { cache: "no-store" }),
      fetch("/api/channels/sync?log=1", { cache: "no-store" }),
    ]);
    if (c.ok) {
      const body = (await c.json()) as { channels: ChannelDto[]; kinds: Kind[] };
      setChannels(body.channels);
      setKinds(body.kinds);
    }
    if (l.ok) setLog((await l.json()) as Log);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      await fetch(`/api/channels/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    setBusy("new");
    try {
      const rooms = data.rooms.filter((r) => r.active);
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: newKind,
          roomMaps: rooms.map((r, i) => ({ roomId: r.id, externalRoomId: `${newKind.replace(/\W/g, "").toUpperCase().slice(0, 3)}-${2001 + i}` })),
        }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("ow.sure"))) return;
    setBusy(id);
    await fetch(`/api/channels/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  async function pushNow() {
    setBusy("push");
    try {
      const res = await fetch("/api/channels/sync", { method: "POST" });
      const body = (await res.json()) as { sent: number; failed: number };
      setResult({ id: "push", text: t("ow.ch.pushed", { s: body.sent, f: body.failed }), tone: body.failed ? "bad" : "ok" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function simulate(ch: ChannelDto) {
    setBusy(ch.id);
    try {
      const inDate = isoDate(addDays(hotelToday(), 3));
      const outDate = isoDate(addDays(hotelToday(), 5));
      const res = await fetch(`/api/channels/${ch.id}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn: inDate, checkOut: outDate, amount: 9800 }),
      });
      const body = (await res.json()) as { response: { accepted?: boolean; bookingCode?: string; reason?: string; error?: string } };
      const r = body.response;
      setResult({
        id: ch.id,
        text: r.accepted
          ? t("ow.ch.simOk", { code: r.bookingCode ?? "" })
          : r.reason === "overbooked"
            ? t("ow.ch.simOverbooked")
            : `${res.status} · ${r.reason ?? r.error ?? ""}`,
        tone: r.accepted ? "ok" : "bad",
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-channels>
      <header className="mb-8">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">{t("ow.execEyebrow")}</p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">{t("ow.channels")}</h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">{t("ow.ch.lead")}</p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy === "push"} onClick={() => void pushNow()} className="owner-control inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-xs font-extrabold uppercase tracking-wide text-white/80 hover:text-white">
            <ArrowUpFromLine className="h-4 w-4" aria-hidden /> {t("ow.ch.pushNow")}
          </button>
          <button type="button" onClick={() => void load()} className="owner-control inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-xs font-extrabold uppercase tracking-wide text-white/80 hover:text-white">
            <RefreshCw className="h-4 w-4" aria-hidden /> {t("ow.refresh")}
          </button>
          {editable ? (
            <span className="ml-auto inline-flex items-center gap-2">
              <select value={newKind} onChange={(e) => setNewKind(e.target.value)} className="own-select min-h-[40px] rounded-xl bg-black/30 px-3 text-sm text-white">
                {kinds.map((k) => (
                  <option key={k.kind} value={k.kind}>
                    {k.kind === "custom" || k.kind === "loopback" ? t(`ow.ch.kind.${k.kind}`) : k.label}
                  </option>
                ))}
              </select>
              <button type="button" disabled={busy === "new"} onClick={() => void add()} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-own-blue px-4 text-xs font-extrabold uppercase tracking-wide text-white">
                <Plus className="h-4 w-4" aria-hidden /> {t("ow.ch.connect")}
              </button>
            </span>
          ) : null}
        </div>
        {result?.id === "push" ? <p className={cn("mt-3 text-sm font-bold", result.tone === "ok" ? "text-deal" : "text-red-300")}>{result.text}</p> : null}
      </header>

      <div className="space-y-4">
        {channels.map((ch) => (
          <section key={ch.id} className="owner-panel rounded-2xl p-6" data-channel={ch.kind}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">
                  {ch.name} <span className="text-sm font-semibold text-white/50">· {ch.kind}</span>
                </h2>
                <p className="mt-1 text-xs font-semibold text-white/55">
                  {ch.lastSyncAt ? `${t("ow.ch.lastSync")} ${new Date(ch.lastSyncAt).toLocaleString()}` : t("ow.ch.neverSynced")}
                  {ch.lastError ? <span className="ml-2 text-red-300">{ch.lastError}</span> : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-white/80">
                  <input type="checkbox" checked={ch.enabled} disabled={!editable || busy === ch.id} onChange={(e) => void patch(ch.id, { enabled: e.target.checked })} />
                  {ch.enabled ? t("ow.ch.enabled") : t("ow.ch.disabled")}
                </label>
                <select value={ch.mode} disabled={!editable} onChange={(e) => void patch(ch.id, { mode: e.target.value })} className="own-select min-h-[36px] rounded-lg bg-black/30 px-2 text-xs text-white">
                  {["both", "push", "pull", "off"].map((m) => (
                    <option key={m} value={m}>
                      {t(`ow.ch.mode.${m}`)}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-1 text-xs font-bold text-white/80">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    step={0.5}
                    defaultValue={ch.commissionPct}
                    disabled={!editable}
                    onBlur={(e) => Number(e.target.value) !== ch.commissionPct && void patch(ch.id, { commissionPct: Number(e.target.value) })}
                    className="min-h-[36px] w-16 px-2 text-xs"
                    aria-label={t("ow.ch.commission")}
                  />
                  %
                </label>
                {editable ? (
                  <>
                    <button type="button" disabled={busy === ch.id || !ch.enabled} onClick={() => void simulate(ch)} className="owner-control inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-gold disabled:opacity-40" data-simulate={ch.kind}>
                      <Send className="h-3.5 w-3.5" aria-hidden /> {t("ow.ch.simulate")}
                    </button>
                    <button type="button" onClick={() => void remove(ch.id)} className="owner-control inline-flex min-h-[36px] items-center rounded-lg px-2.5 text-xs font-extrabold text-red-300" aria-label={t("ow.del")}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {result?.id === ch.id ? (
              <p className={cn("mt-3 text-sm font-bold", result.tone === "ok" ? "text-deal" : "text-red-300")} data-sim-result={result.tone}>
                {result.text}
              </p>
            ) : null}

            {editable ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-white/70">
                  {t("ow.ch.endpoint")}
                  <input defaultValue={ch.endpoint} placeholder="https://partner.example/ari" onBlur={(e) => e.target.value !== ch.endpoint && void patch(ch.id, { endpoint: e.target.value })} className="mt-1 min-h-[40px] w-full px-3 text-sm" />
                </label>
                <label className="block text-xs font-bold text-white/70">
                  {t("ow.ch.secret")} {ch.hasSecret ? <span className="text-deal">· {t("ow.ch.secretSet")}</span> : null}
                  <input type="password" placeholder="••••••••" autoComplete="new-password" onBlur={(e) => e.target.value && void patch(ch.id, { secret: e.target.value })} className="mt-1 min-h-[40px] w-full px-3 text-sm" />
                </label>
              </div>
            ) : null}

            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-[0.14em] text-own-blue">
                {t("ow.ch.mapping")} · {ch.roomMaps.length}
              </summary>
              <ul className="mt-2 grid gap-1 text-xs text-white/75 sm:grid-cols-2">
                {ch.roomMaps.map((m) => {
                  const room = data.rooms.find((r) => r.id === m.roomId);
                  return (
                    <li key={m.roomId} className="flex justify-between gap-2 border-t border-white/10 py-1">
                      <span>{room ? tr(room.name) : m.roomId}</span>
                      <span className="font-mono text-white/55">{m.externalRoomId}</span>
                    </li>
                  );
                })}
              </ul>
            </details>
          </section>
        ))}
        {channels.length === 0 ? <p className="text-sm text-white/55">{t("ow.ch.none")}</p> : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="owner-panel rounded-2xl p-6" data-outbox>
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-white">
            <ArrowUpFromLine className="h-4 w-4 text-own-blue" aria-hidden /> {t("ow.ch.outboxH")}
          </h2>
          <p className="mb-3 text-xs text-white/55">{t("ow.ch.outboxSub")}</p>
          <ul className="max-h-[360px] space-y-1 overflow-y-auto text-xs">
            {(log?.outbox ?? []).map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-2 border-t border-white/10 py-1.5 text-white/80">
                <span className="min-w-0">
                  <span className="font-bold text-white">{o.type}</span> · {o.payload.reason ?? ""} · {o.payload.roomSlug ?? ""}{" "}
                  {o.payload.dates?.length ? `· ${o.payload.dates[0]}${o.payload.dates.length > 1 ? ` → ${o.payload.dates[o.payload.dates.length - 1]}` : ""}` : ""}
                  {o.lastError ? <span className="block text-red-300">{o.lastError}</span> : null}
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase", o.status === "sent" ? "bg-deal/20 text-deal" : o.status === "failed" ? "bg-red-400/20 text-red-300" : "bg-gold/20 text-gold")}>
                  {t(`ow.ch.st.${o.status}`)}
                </span>
              </li>
            ))}
            {log && log.outbox.length === 0 ? <li className="text-white/50">{t("ow.nothingHere")}</li> : null}
          </ul>
        </section>
        <section className="owner-panel rounded-2xl p-6" data-inbound>
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-white">
            <ArrowDownToLine className="h-4 w-4 text-gold" aria-hidden /> {t("ow.ch.inboundH")}
          </h2>
          <p className="mb-3 text-xs text-white/55">{t("ow.ch.inboundSub")}</p>
          <ul className="max-h-[360px] space-y-1 overflow-y-auto text-xs">
            {(log?.inbound ?? []).map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-2 border-t border-white/10 py-1.5 text-white/80">
                <span className="min-w-0">
                  <span className="font-bold text-white">{i.channel}</span> · {i.type} · <span className="font-mono">{i.externalId}</span>
                  {i.error ? <span className="block text-red-300">{i.error}</span> : null}
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase", i.status === "processed" ? "bg-deal/20 text-deal" : i.status === "overbooked" ? "bg-red-400/20 text-red-300" : "bg-white/10 text-white/60")}>
                  {t(`ow.ch.st.${i.status}`)}
                </span>
              </li>
            ))}
            {log && log.inbound.length === 0 ? <li className="text-white/50">{t("ow.nothingHere")}</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
