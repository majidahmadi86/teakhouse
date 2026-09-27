"use client";

import { useCallback, useEffect, useState } from "react";
import { ROLES, type Role } from "@/lib/auth/rbac";
import { useI18n } from "@/lib/i18n";
import type { HotelDto } from "@/lib/ownerTypes";
import { useStaff } from "@/lib/staffSession";
import { cn } from "@/lib/utils";

const inputClass = "min-h-[44px] w-full rounded-[10px] border-0 bg-black/30 px-4 py-3 text-base text-white caret-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-white/80">{label}</div>
      {children}
    </div>
  );
}

/** v15 · PromptPay, bank details, time zone, base currency, vault status. */
export function MoneyRailsSection({
  hotel,
  setHotel,
  saving,
  onSave,
}: {
  hotel: HotelDto | null;
  setHotel: (h: HotelDto) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const { t } = useI18n();
  if (!hotel) return null;
  const set = (patch: Partial<HotelDto>) => setHotel({ ...hotel, ...patch });
  return (
    <section className="owner-panel mb-8 rounded-2xl p-6 md:p-8" data-money-rails>
      <h2 className="mb-2 font-display text-xl font-semibold text-white">{t("ow.setMoneyH")}</h2>
      <p className="mb-6 text-sm text-white/55">{t("ow.setMoneySub")}</p>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={t("ow.setPromptPay")}>
          <input value={hotel.promptPayId} onChange={(e) => set({ promptPayId: e.target.value })} placeholder="0812345678" className={inputClass} inputMode="numeric" />
        </Field>
        <Field label={t("ow.setTimeZone")}>
          <input value={hotel.timeZone} onChange={(e) => set({ timeZone: e.target.value })} placeholder="Asia/Bangkok" className={inputClass} />
        </Field>
        <Field label={t("ow.setBankName")}>
          <input value={hotel.bankName} onChange={(e) => set({ bankName: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t("ow.setBankAccountName")}>
          <input value={hotel.bankAccountName} onChange={(e) => set({ bankAccountName: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t("ow.setBankAccountNo")}>
          <input value={hotel.bankAccountNo} onChange={(e) => set({ bankAccountNo: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t("ow.setBankSwift")}>
          <input value={hotel.bankSwift} onChange={(e) => set({ bankSwift: e.target.value })} className={inputClass} />
        </Field>
      </div>
      <p className={cn("mt-5 text-sm font-semibold", hotel.vaultEnabled ? "text-deal" : "text-gold/90")} data-vault-status={hotel.vaultEnabled ? "on" : "off"}>
        {hotel.vaultEnabled ? t("ow.setVaultOn") : t("ow.setVaultOff")}
      </p>
      <div className="mt-6">
        <button type="button" onClick={onSave} disabled={saving} className="min-h-[44px] rounded-xl bg-own-blue px-5 text-sm font-bold text-white disabled:opacity-60">
          {saving ? t("ow.setSaving") : t("ow.setSaveHotel")}
        </button>
      </div>
    </section>
  );
}

type StaffRow = { id: string; email: string; name: string; role: string; active: boolean };

/** v15 · Staff accounts · owner only. */
export function StaffSection() {
  const { t } = useI18n();
  const { can } = useStaff();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [draft, setDraft] = useState({ name: "", email: "", role: "frontdesk" as Role, password: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/list", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as StaffRow[]);
  }, []);

  useEffect(() => {
    if (can("staff:write")) void load();
  }, [can, load]);

  if (!can("staff:write")) return null;

  async function invite() {
    setMsg("");
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite", ...draft }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(body.error ?? "Failed");
      return;
    }
    setDraft({ name: "", email: "", role: "frontdesk", password: "" });
    await load();
  }

  async function deactivate(id: string) {
    if (!window.confirm(t("ow.sure"))) return;
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate", staffId: id }),
    });
    await load();
  }

  return (
    <section className="owner-panel mb-8 rounded-2xl p-6 md:p-8" data-staff>
      <h2 className="mb-2 font-display text-xl font-semibold text-white">{t("ow.setStaffH")}</h2>
      <p className="mb-2 text-sm text-white/55">{t("ow.setStaffSub")}</p>
      <p className="mb-5 text-xs font-semibold text-white/45">{t("ow.setStaffDemoNote")}</p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="owner-inset flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">{r.name}</span>
              <span className="block text-xs text-white/55">{r.email}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.66rem] font-extrabold uppercase tracking-wide text-white/80">{t(`ow.role.${r.role}`)}</span>
              {r.active ? (
                <button type="button" onClick={() => void deactivate(r.id)} className="owner-control min-h-[32px] rounded-lg px-2.5 text-[0.7rem] font-extrabold text-red-300">
                  {t("ow.setStaffDeactivate")}
                </button>
              ) : (
                <span className="text-[0.66rem] font-extrabold uppercase text-white/40">{t("ow.inactive")}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-5">
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t("ow.setStaffName")} className="min-h-[40px] px-3 text-sm" />
        <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder={t("ow.email")} type="email" className="min-h-[40px] px-3 text-sm" />
        <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })} className="own-select min-h-[40px] rounded-lg bg-black/30 px-2 text-sm text-white" aria-label={t("ow.setStaffRole")}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`ow.role.${r}`)}
            </option>
          ))}
        </select>
        <input value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder={t("ow.password")} type="password" autoComplete="new-password" className="min-h-[40px] px-3 text-sm" />
        <button type="button" onClick={() => void invite()} className="min-h-[40px] rounded-xl bg-own-blue px-4 text-xs font-extrabold uppercase tracking-wide text-white">
          {t("ow.setStaffInvite")}
        </button>
      </div>
      {msg ? <p className="mt-3 text-sm font-semibold text-red-300">{msg}</p> : null}
    </section>
  );
}
