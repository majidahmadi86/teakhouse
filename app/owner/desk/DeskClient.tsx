"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Check, LogIn, LogOut, Search, Sparkles, UserRound } from "lucide-react";
import { OwnerRise, OwnerStagger } from "@/components/owner/OwnerMotion";
import { useI18n } from "@/lib/i18n";
import { type Booking, useOwner } from "@/lib/ownerStore";
import type { ServiceRequestDto } from "@/lib/serviceRequests";
import { useStaff } from "@/lib/staffSession";
import { cn, formatBaht, hotelTodayIso } from "@/lib/utils";

/**
 * v15 · Operations view · the front desk's screen.
 *
 *   Today      arrivals to check in, departures to check out, who is in house
 *   Requests   what guests (and the concierge on their behalf) have asked for,
 *              polled every 15 seconds, with a chime-free toast when new ones land
 *   Housekeeping  every room's state, one tap to move it on
 *   Guests     preference log · search a name, read the notes, add one
 *
 * Everything here is role-gated by the server: housekeeping can move room
 * states and work the request queue; check-in and guest notes need the desk.
 */

type HkStatus = "clean" | "dirty" | "inspected" | "ooo";
const HK_NEXT: Record<HkStatus, HkStatus> = { dirty: "clean", clean: "inspected", inspected: "dirty", ooo: "clean" };

type GuestRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  passportMasked: string;
  vip: boolean;
  preferences: string;
  notes: { id: string; tag: string; body: string; createdAt: string }[];
};

export default function DeskClient() {
  const { t, tr } = useI18n();
  const { data, refresh } = useOwner();
  const { can } = useStaff();
  const today = hotelTodayIso();
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [note, setNote] = useState<{ guestId: string; body: string; tag: string } | null>(null);
  const [hk, setHk] = useState<Record<string, HkStatus>>({});

  const rooms = data.rooms.filter((r) => r.active);
  const roomName = useCallback((slug: string) => {
    const r = data.rooms.find((x) => x.slug === slug);
    return r ? tr(r.name) : slug;
  }, [data.rooms, tr]);

  const live = data.bookings.filter((b) => b.status !== "cancelled");
  const arrivals = live.filter((b) => b.checkIn === today && b.status === "ok");
  const departures = live.filter((b) => b.checkOut === today && b.status === "in");
  const inHouse = live.filter((b) => b.status === "in");

  /* ── Requests · poll ────────────────────────────────────────────────────── */
  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/service-requests?status=new,accepted", { cache: "no-store" });
      if (!res.ok) return;
      const rows = (await res.json()) as ServiceRequestDto[];
      if (seen.current) {
        const fresh = rows.filter((r) => !seen.current!.has(r.id) && r.status === "new");
        if (fresh.length) setToast(t("ow.desk.newRequest", { n: fresh.length }));
      }
      seen.current = new Set(rows.map((r) => r.id));
      setRequests(rows);
    } catch {
      /* keep */
    }
  }, [t]);

  useEffect(() => {
    void loadRequests();
    const id = window.setInterval(() => void loadRequests(), 15000);
    return () => window.clearInterval(id);
  }, [loadRequests]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function moveRequest(id: string, status: "accepted" | "done" | "cancelled") {
    setBusy(id);
    try {
      await fetch(`/api/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadRequests();
    } finally {
      setBusy(null);
    }
  }

  /* ── Lifecycle ─────────────────────────────────────────────────────────── */
  async function lifecycle(b: Booking, action: "checkin" | "checkout" | "noshow") {
    setBusy(b.id);
    try {
      await fetch(`/api/bookings/${b.id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  /* ── Housekeeping ──────────────────────────────────────────────────────── */
  const hkOf = (slug: string, fallback?: string): HkStatus => (hk[slug] ?? fallback ?? "clean") as HkStatus;
  async function cycleHk(roomId: string, slug: string, current: HkStatus) {
    const next = HK_NEXT[current];
    setHk((prev) => ({ ...prev, [slug]: next }));
    await fetch(`/api/rooms/${roomId}/housekeeping`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  /* ── Guests ────────────────────────────────────────────────────────────── */
  const searchGuests = useCallback(async (query: string) => {
    const res = await fetch(`/api/guests?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (res.ok) setGuests((await res.json()) as GuestRow[]);
  }, []);
  useEffect(() => {
    if (!can("guests:read")) return;
    const id = window.setTimeout(() => void searchGuests(q), 250);
    return () => window.clearTimeout(id);
  }, [q, searchGuests, can]);

  async function saveNote() {
    if (!note || !note.body.trim()) return;
    await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "note", guestId: note.guestId, tag: note.tag, body: note.body }),
    });
    setNote(null);
    await searchGuests(q);
  }

  const hkCounts = useMemo(() => {
    const c = { clean: 0, dirty: 0, inspected: 0, ooo: 0 };
    for (const r of rooms) c[hkOf(r.slug, r.hkStatus)] += 1;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, hk]);

  return (
    <div data-desk>
      {toast ? (
        <div role="status" className="fixed right-4 top-[calc(var(--demo-bar-h)+1rem)] z-toast flex items-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-navy shadow-2xl" data-desk-toast>
          <BellRing className="h-4 w-4" aria-hidden /> {toast}
        </div>
      ) : null}

      <header className="mb-8">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">{t("ow.deskEyebrow")}</p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">{t("ow.deskH1")}</h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">{t("ow.deskLead")}</p>
      </header>

      <OwnerStagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <OwnerRise><Tile label={t("ow.desk.arrivals")} value={arrivals.length} /></OwnerRise>
        <OwnerRise><Tile label={t("ow.desk.departures")} value={departures.length} /></OwnerRise>
        <OwnerRise><Tile label={t("ow.desk.inHouse")} value={inHouse.length} /></OwnerRise>
        <OwnerRise><Tile label={t("ow.desk.openRequests")} value={requests.filter((r) => r.status === "new").length} gold /></OwnerRise>
      </OwnerStagger>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today */}
        <section className="owner-panel rounded-2xl p-6" data-desk-today>
          <h2 className="mb-1 font-display text-xl font-semibold text-white">{t("ow.desk.todayH")}</h2>
          <p className="mb-4 text-sm text-white/55">{today}</p>
          <Group title={t("ow.desk.arrivals")} empty={t("ow.desk.noArrivals")}>
            {arrivals.map((b) => (
              <Row key={b.id} b={b} room={roomName(b.roomSlug)}>
                {can("bookings:checkin") ? (
                  <button type="button" disabled={busy === b.id} onClick={() => void lifecycle(b, "checkin")} className="owner-control inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-deal" data-checkin={b.code}>
                    <LogIn className="h-4 w-4" aria-hidden /> {t("ow.checkin")}
                  </button>
                ) : null}
              </Row>
            ))}
          </Group>
          <Group title={t("ow.desk.departures")} empty={t("ow.desk.noDepartures")}>
            {departures.map((b) => (
              <Row key={b.id} b={b} room={roomName(b.roomSlug)}>
                {can("bookings:checkin") ? (
                  <button type="button" disabled={busy === b.id} onClick={() => void lifecycle(b, "checkout")} className="owner-control inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-gold" data-checkout={b.code}>
                    <LogOut className="h-4 w-4" aria-hidden /> {t("ow.checkout")}
                  </button>
                ) : null}
              </Row>
            ))}
          </Group>
          <Group title={t("ow.desk.inHouse")} empty={t("ow.desk.noInHouse")}>
            {inHouse.slice(0, 8).map((b) => (
              <Row key={b.id} b={b} room={roomName(b.roomSlug)}>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.66rem] font-extrabold uppercase", b.paymentStatus === "paid" ? "bg-deal/20 text-deal" : b.paymentStatus === "deposit" ? "bg-gold/20 text-gold" : "bg-white/10 text-white/70")}>
                  {t(`ow.pay.${b.paymentStatus ?? "unpaid"}`)}
                </span>
              </Row>
            ))}
          </Group>
        </section>

        {/* Requests */}
        <section className="owner-panel rounded-2xl p-6" data-desk-requests>
          <h2 className="mb-1 font-display text-xl font-semibold text-white">{t("ow.desk.requestsH")}</h2>
          <p className="mb-4 text-sm text-white/55">{t("ow.desk.requestsSub")}</p>
          {requests.length === 0 ? (
            <p className="text-sm text-white/55">{t("ow.desk.noRequests")}</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className={cn("owner-inset rounded-xl p-3", r.status === "new" && "ring-1 ring-gold/40")} data-request={r.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-own-blue">
                        {t(`cg.req.kind.${r.kind}`)}
                        {r.source === "concierge_ai" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-1.5 py-0.5 text-gold">
                            <Sparkles className="h-3 w-3" aria-hidden /> AI
                          </span>
                        ) : null}
                        {r.bookingCode ? <span className="text-white/50">{r.bookingCode}</span> : null}
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">{r.title}</p>
                      {r.details ? <p className="mt-0.5 text-xs text-white/65">{r.details}</p> : null}
                      <p className="mt-1 text-[0.7rem] font-semibold text-white/50">
                        {r.guest ? `${r.guest} · ` : ""}
                        {r.roomSlug ? `${roomName(r.roomSlug)} · ` : ""}
                        {r.due || new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {r.status === "new" ? (
                        <button type="button" disabled={busy === r.id} onClick={() => void moveRequest(r.id, "accepted")} className="owner-control min-h-[32px] rounded-lg px-2.5 text-[0.7rem] font-extrabold text-own-blue">
                          {t("ow.desk.accept")}
                        </button>
                      ) : null}
                      <button type="button" disabled={busy === r.id} onClick={() => void moveRequest(r.id, "done")} className="owner-control inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 text-[0.7rem] font-extrabold text-deal">
                        <Check className="h-3.5 w-3.5" aria-hidden /> {t("ow.desk.done")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Housekeeping */}
        <section className="owner-panel rounded-2xl p-6" data-desk-housekeeping>
          <h2 className="mb-1 font-display text-xl font-semibold text-white">{t("ow.desk.hkH")}</h2>
          <p className="mb-4 text-sm text-white/55">
            {t("ow.desk.hkSub")} · {hkCounts.dirty} {t("ow.hk.dirty")} · {hkCounts.clean} {t("ow.hk.clean")} · {hkCounts.inspected} {t("ow.hk.inspected")}
            {hkCounts.ooo ? ` · ${hkCounts.ooo} ${t("ow.hk.ooo")}` : ""}
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rooms.map((r) => {
              const s = hkOf(r.slug, r.hkStatus);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={!can("housekeeping:write")}
                    onClick={() => void cycleHk(r.id, r.slug, s)}
                    className={cn(
                      "flex min-h-[64px] w-full flex-col items-start justify-between rounded-xl border p-3 text-left transition",
                      s === "dirty" && "border-red-400/40 bg-red-400/10",
                      s === "clean" && "border-own-blue/40 bg-own-blue/10",
                      s === "inspected" && "border-deal/40 bg-deal/10",
                      s === "ooo" && "border-white/20 bg-white/5"
                    )}
                    data-hk={r.slug}
                    aria-label={`${tr(r.name)} · ${t(`ow.hk.${s}`)}`}
                  >
                    <span className="truncate text-sm font-bold text-white">{tr(r.name)}</span>
                    <span className={cn("text-[0.66rem] font-extrabold uppercase tracking-wide", s === "dirty" ? "text-red-300" : s === "clean" ? "text-own-blue" : s === "inspected" ? "text-deal" : "text-white/60")}>
                      {t(`ow.hk.${s}`)}
                      {(r.units ?? 1) > 1 ? ` · ×${r.units}` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[0.72rem] font-semibold text-white/50">{t("ow.desk.hkHint")}</p>
        </section>

        {/* Guests */}
        {can("guests:read") ? (
          <section className="owner-panel rounded-2xl p-6" data-desk-guests>
            <h2 className="mb-1 font-display text-xl font-semibold text-white">{t("ow.desk.guestsH")}</h2>
            <p className="mb-4 text-sm text-white/55">{t("ow.desk.guestsSub")}</p>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ow.searchph")} className="min-h-[44px] w-full pl-10 pr-4 text-sm" />
            </label>
            <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {guests.map((g) => (
                <li key={g.id} className="owner-inset rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <UserRound className="h-4 w-4 text-white/50" aria-hidden />
                        <span className="truncate">{g.name}</span>
                        {g.vip ? <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[0.62rem] font-extrabold uppercase text-gold">VIP</span> : null}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/55">
                        {[g.email, g.phone, g.nationality, g.passportMasked].filter(Boolean).join(" · ")}
                      </p>
                      {g.preferences ? <p className="mt-1 text-xs font-semibold text-gold/90">{g.preferences}</p> : null}
                    </div>
                    {can("guests:notes") ? (
                      <button type="button" onClick={() => setNote({ guestId: g.id, body: "", tag: "preference" })} className="owner-control min-h-[32px] shrink-0 rounded-lg px-2.5 text-[0.7rem] font-extrabold text-own-blue">
                        + {t("ow.desk.addNote")}
                      </button>
                    ) : null}
                  </div>
                  {g.notes.length ? (
                    <ul className="mt-2 space-y-1 border-t border-white/10 pt-2">
                      {g.notes.map((n) => (
                        <li key={n.id} className="text-xs text-white/75">
                          <span className="mr-1.5 rounded bg-white/10 px-1 py-0.5 text-[0.62rem] font-extrabold uppercase text-white/60">{t(`ow.note.${n.tag}`)}</span>
                          {n.body}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {note?.guestId === g.id ? (
                    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                      <div className="flex flex-wrap gap-1">
                        {["preference", "allergy", "occasion", "incident", "note"].map((tag) => (
                          <button key={tag} type="button" onClick={() => setNote({ ...note, tag })} className={cn("rounded-full px-2 py-1 text-[0.64rem] font-extrabold uppercase", note.tag === tag ? "bg-own-blue text-white" : "bg-white/10 text-white/60")}>
                            {t(`ow.note.${tag}`)}
                          </button>
                        ))}
                      </div>
                      <textarea value={note.body} onChange={(e) => setNote({ ...note, body: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm" placeholder={t("ow.desk.notePh")} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void saveNote()} className="min-h-[36px] rounded-lg bg-own-blue px-3 text-xs font-extrabold text-white">
                          {t("ow.save")}
                        </button>
                        <button type="button" onClick={() => setNote(null)} className="min-h-[36px] rounded-lg px-3 text-xs font-bold text-white/60">
                          {t("ow.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
              {guests.length === 0 ? <li className="text-sm text-white/55">{t("ow.noMatch")}</li> : null}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Tile({ label, value, gold }: { label: string; value: number; gold?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-5", gold ? "bg-gold/15 shadow-[inset_0_1px_0_rgba(232,200,122,.25)]" : "owner-panel")}>
      <b className={cn("mb-2 block text-[0.66rem] font-extrabold uppercase tracking-[0.16em]", gold ? "text-gold" : "text-own-blue")}>{label}</b>
      <span className="font-display text-4xl font-semibold text-white">{value}</span>
    </div>
  );
}

function Group({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-own-blue">{title}</h3>
      {children.length === 0 ? <p className="text-sm text-white/50">{empty}</p> : <ul className="space-y-2">{children}</ul>}
    </div>
  );
}

function Row({ b, room, children }: { b: Booking; room: string; children?: React.ReactNode }) {
  return (
    <li className="owner-inset flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">
          {b.guest} <span className="font-semibold text-white/50">· {b.code}</span>
        </p>
        <p className="truncate text-xs text-white/60">
          {room} · {b.checkIn} → {b.checkOut} · {formatBaht(b.amount + (b.packagesAmount ?? 0))}
          {b.arrivalTime ? ` · ${b.arrivalTime}` : ""}
        </p>
        {b.specialRequests ? <p className="truncate text-xs font-semibold text-gold/90">{b.specialRequests}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
