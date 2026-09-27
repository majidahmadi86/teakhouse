"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Addon } from "@/lib/addons";
import { useI18n } from "@/lib/i18n";
import { useOwner } from "@/lib/ownerStore";
import { useStaff } from "@/lib/staffSession";
import { cn, formatBaht } from "@/lib/utils";
import type { YieldRule } from "@/lib/yield";

/**
 * v15 · Packages & yield · what a guest can add to a stay, and how demand
 * moves the rate. Both are plain rows the owner edits in place.
 */

const UNITS = ["stay", "night", "person"] as const;
const CATS = ["transfer", "dining", "wellness", "experience", "family"] as const;

export default function PackagesClient() {
  const { t, tr } = useI18n();
  const { data } = useOwner();
  const { can } = useStaff();
  const editable = can("content:write");
  const yieldEditable = can("rates:write");
  const [addons, setAddons] = useState<Addon[]>([]);
  const [rules, setRules] = useState<YieldRule[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ key: "", nameEn: "", nameTh: "", price: 2500, unit: "stay", category: "experience" });
  const [ruleDraft, setRuleDraft] = useState({ kind: "occupancy", label: "", threshold: 80, multiplier: 1.1, minNights: 2, maxLeadDays: "" });

  const load = useCallback(async () => {
    const [a, y] = await Promise.all([fetch("/api/addons?all=1", { cache: "no-store" }), fetch("/api/yield", { cache: "no-store" })]);
    if (a.ok) setAddons((await a.json()) as Addon[]);
    if (y.ok) setRules((await y.json()) as YieldRule[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchAddon(id: string, body: Partial<Addon>) {
    setBusy(true);
    await fetch(`/api/addons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
    setBusy(false);
  }
  async function removeAddon(id: string) {
    if (!window.confirm(t("ow.sure"))) return;
    await fetch(`/api/addons/${id}`, { method: "DELETE" });
    await load();
  }
  async function createAddon() {
    if (!draft.nameEn.trim()) return;
    setBusy(true);
    await fetch("/api/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: draft.key || draft.nameEn,
        name: { en: draft.nameEn, th: draft.nameTh || draft.nameEn },
        price: Number(draft.price),
        unit: draft.unit,
        category: draft.category,
        order: addons.length,
      }),
    });
    setDraft({ key: "", nameEn: "", nameTh: "", price: 2500, unit: "stay", category: "experience" });
    await load();
    setBusy(false);
  }

  async function saveRule(body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/yield", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
    setBusy(false);
  }

  return (
    <div data-packages-admin>
      <header className="mb-8">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">{t("ow.ownerEyebrow")}</p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">{t("ow.packages")}</h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">{t("ow.pkg.lead")}</p>
      </header>

      <section className="owner-panel mb-6 rounded-2xl p-6">
        <h2 className="mb-4 font-display text-xl font-semibold text-white">{t("ow.pkg.listH")}</h2>
        <ul className="space-y-2">
          {addons.map((a) => (
            <li key={a.id} className="owner-inset grid gap-2 rounded-xl p-3 sm:grid-cols-[1fr_auto] sm:items-center" data-addon-row={a.key}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">
                  <span title={a.key}>{tr(a.name)}</span>
                </p>
                <p className="text-xs text-white/60">
                  {t(`ow.pkg.cat.${a.category}`)} · {formatBaht(a.price)} {t(`bk.pkg.unit.${a.unit}`)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {editable ? (
                  <>
                    <input type="number" min={0} defaultValue={a.price} onBlur={(e) => Number(e.target.value) !== a.price && void patchAddon(a.id, { price: Number(e.target.value) })} className="min-h-[36px] w-24 px-2 text-xs" aria-label={t("ow.f.price")} />
                    <select value={a.unit} onChange={(e) => void patchAddon(a.id, { unit: e.target.value as Addon["unit"] })} className="own-select min-h-[36px] rounded-lg bg-black/30 px-2 text-xs text-white">
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {t(`bk.pkg.unit.${u}`)}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80">
                      <input type="checkbox" checked={a.published} onChange={(e) => void patchAddon(a.id, { published: e.target.checked })} /> {t("ow.published")}
                    </label>
                    <button type="button" onClick={() => void removeAddon(a.id)} className="owner-control inline-flex min-h-[36px] items-center rounded-lg px-2.5 text-red-300" aria-label={t("ow.del")}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                ) : (
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase", a.published ? "bg-deal/20 text-deal" : "bg-white/10 text-white/60")}>{a.published ? t("ow.published") : t("ow.hidden")}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {editable ? (
          <div className="mt-5 grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-6">
            <input value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} placeholder={t("ow.f.nameEn")} className="min-h-[40px] px-3 text-sm sm:col-span-2" />
            <input value={draft.nameTh} onChange={(e) => setDraft({ ...draft, nameTh: e.target.value })} placeholder={t("ow.f.nameTh")} className="min-h-[40px] px-3 text-sm sm:col-span-2" />
            <input type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} className="min-h-[40px] px-3 text-sm" aria-label={t("ow.f.price")} />
            <select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} className="own-select min-h-[40px] rounded-lg bg-black/30 px-2 text-sm text-white">
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`bk.pkg.unit.${u}`)}
                </option>
              ))}
            </select>
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="own-select min-h-[40px] rounded-lg bg-black/30 px-2 text-sm text-white sm:col-span-2">
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {t(`ow.pkg.cat.${c}`)}
                </option>
              ))}
            </select>
            <button type="button" disabled={busy} onClick={() => void createAddon()} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-own-blue px-4 text-xs font-extrabold uppercase tracking-wide text-white sm:col-span-2">
              <Plus className="h-4 w-4" aria-hidden /> {t("ow.pkg.add")}
            </button>
          </div>
        ) : null}
      </section>

      <section className="owner-panel rounded-2xl p-6" data-yield-admin>
        <h2 className="mb-1 font-display text-xl font-semibold text-white">{t("ow.yield.h")}</h2>
        <p className="mb-4 text-sm text-white/55">{t("ow.yield.sub")}</p>
        <ul className="space-y-2">
          {rules.map((r) => (
            <li key={r.id} className="owner-inset flex flex-wrap items-center justify-between gap-2 rounded-xl p-3" data-yield-row={r.kind}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">
                  {r.label || t(`ow.yield.kind.${r.kind}`)} <span className="text-xs font-semibold text-white/50">· {t(`ow.yield.kind.${r.kind}`)}</span>
                </p>
                <p className="text-xs text-white/60">
                  {r.kind === "occupancy" ? t("ow.yield.occDesc", { p: r.threshold, m: r.multiplier }) : null}
                  {r.kind === "lead_time"
                    ? r.maxLeadDays !== null
                      ? t("ow.yield.lastMinuteDesc", { d: r.maxLeadDays, m: r.multiplier })
                      : t("ow.yield.earlyDesc", { d: r.threshold, m: r.multiplier })
                    : null}
                  {r.kind === "min_stay" ? t("ow.yield.minStayDesc", { n: r.minNights }) : null}
                  {r.startDate ? ` · ${r.startDate} → ${r.endDate ?? ""}` : ""}
                  {r.roomId ? ` · ${data.rooms.find((x) => x.id === r.roomId) ? tr(data.rooms.find((x) => x.id === r.roomId)!.name) : r.roomId}` : ` · ${t("ow.yield.allRooms")}`}
                </p>
              </div>
              {yieldEditable ? (
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80">
                    <input type="checkbox" checked={r.enabled} onChange={(e) => void saveRule({ ...r, enabled: e.target.checked })} /> {t("ow.active")}
                  </label>
                  <button type="button" onClick={() => window.confirm(t("ow.sure")) && void saveRule({ id: r.id, delete: true })} className="owner-control inline-flex min-h-[36px] items-center rounded-lg px-2.5 text-red-300" aria-label={t("ow.del")}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {rules.length === 0 ? <li className="text-sm text-white/55">{t("ow.nothingHere")}</li> : null}
        </ul>
        {yieldEditable ? (
          <div className="mt-5 grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-6">
            <select value={ruleDraft.kind} onChange={(e) => setRuleDraft({ ...ruleDraft, kind: e.target.value })} className="own-select min-h-[40px] rounded-lg bg-black/30 px-2 text-sm text-white sm:col-span-2">
              {["occupancy", "lead_time", "min_stay"].map((k) => (
                <option key={k} value={k}>
                  {t(`ow.yield.kind.${k}`)}
                </option>
              ))}
            </select>
            <input value={ruleDraft.label} onChange={(e) => setRuleDraft({ ...ruleDraft, label: e.target.value })} placeholder={t("ow.rateLabel")} className="min-h-[40px] px-3 text-sm sm:col-span-2" />
            {ruleDraft.kind === "occupancy" ? (
              <input type="number" min={0} max={100} value={ruleDraft.threshold} onChange={(e) => setRuleDraft({ ...ruleDraft, threshold: Number(e.target.value) })} className="min-h-[40px] px-3 text-sm" aria-label={t("ow.yield.threshold")} />
            ) : ruleDraft.kind === "lead_time" ? (
              <input type="number" min={0} value={ruleDraft.threshold} onChange={(e) => setRuleDraft({ ...ruleDraft, threshold: Number(e.target.value) })} className="min-h-[40px] px-3 text-sm" aria-label={t("ow.yield.leadDays")} />
            ) : (
              <input type="number" min={1} value={ruleDraft.minNights} onChange={(e) => setRuleDraft({ ...ruleDraft, minNights: Number(e.target.value) })} className="min-h-[40px] px-3 text-sm" aria-label={t("ow.yield.minNights")} />
            )}
            {ruleDraft.kind !== "min_stay" ? (
              <input type="number" step={0.01} min={0.5} max={2} value={ruleDraft.multiplier} onChange={(e) => setRuleDraft({ ...ruleDraft, multiplier: Number(e.target.value) })} className="min-h-[40px] px-3 text-sm" aria-label={t("ow.rateMultiplier")} />
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void saveRule({
                  kind: ruleDraft.kind,
                  label: ruleDraft.label,
                  threshold: ruleDraft.threshold,
                  multiplier: ruleDraft.multiplier,
                  minNights: ruleDraft.minNights,
                  maxLeadDays: ruleDraft.maxLeadDays ? Number(ruleDraft.maxLeadDays) : null,
                })
              }
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-own-blue px-4 text-xs font-extrabold uppercase tracking-wide text-white sm:col-span-6"
            >
              <Plus className="h-4 w-4" aria-hidden /> {t("ow.yield.add")}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
