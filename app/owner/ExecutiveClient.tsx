"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { InfoTip } from "@/components/owner/InfoTip";
import { OwnerRise, OwnerStagger } from "@/components/owner/OwnerMotion";
import type { Analytics } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { addDays, cn, formatBaht, isoDate } from "@/lib/utils";

/**
 * v15 · Executive view · the numbers an owner opens the panel for.
 *
 * RevPAR, ADR, occupancy, channel mix with the commission it costs, payouts
 * collected vs outstanding, seven-day pickup, thirty-day forecast, and the
 * report archive. Every figure comes from /api/analytics, computed from the
 * same rows the desk works with, per night, in units.
 */

type Report = {
  id: string;
  kind: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  summary: { occupancyPct: number; adr: number; revpar: number; totalRevenue: number; netRevenue: number; bookings: number; directSharePct: number; collected: number };
};

type Range = "month" | "30d" | "90d";

function rangeDates(range: Range): { from: string; to: string } {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (range === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { from: isoDate(first), to: isoDate(next) };
  }
  const days = range === "30d" ? 30 : 90;
  return { from: isoDate(addDays(today, -days)), to: isoDate(addDays(today, 1)) };
}

export default function ExecutiveClient() {
  const { t } = useI18n();
  const [range, setRange] = useState<Range>("month");
  const [data, setData] = useState<Analytics | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const { from, to } = rangeDates(range);
    try {
      const [a, r] = await Promise.all([
        fetch(`/api/analytics?from=${from}&to=${to}`, { cache: "no-store" }),
        fetch("/api/reports", { cache: "no-store" }),
      ]);
      if (a.ok) setData((await a.json()) as Analytics);
      else setError(true);
      if (r.ok) setReports((await r.json()) as Report[]);
    } catch {
      setError(true);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate(kind: "daily" | "weekly" | "monthly") {
    setBusy(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, email: true }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const csvHref = useMemo(() => {
    const { from, to } = rangeDates(range);
    return `/api/analytics?from=${from}&to=${to}&format=csv`;
  }, [range]);

  const maxRevenue = Math.max(1, ...(data?.series.map((p) => p.revenue) ?? [1]));

  return (
    <div data-executive>
      <header className="mb-8">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">{t("ow.execEyebrow")}</p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">{t("ow.execH1")}</h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">{t("ow.execLead")}</p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="owner-inset flex rounded-xl p-1" role="tablist" aria-label={t("ow.execRange")}>
            {(["month", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={cn(
                  "min-h-[40px] rounded-lg px-3 text-xs font-extrabold uppercase tracking-wide transition",
                  range === r ? "bg-own-blue text-white" : "text-white/60 hover:text-white"
                )}
              >
                {t(`ow.range.${r}`)}
              </button>
            ))}
          </div>
          <a href={csvHref} className="owner-control inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-xs font-extrabold uppercase tracking-wide text-white/80 hover:text-white" download>
            <Download className="h-4 w-4" aria-hidden /> CSV
          </a>
          <button type="button" onClick={() => void load()} className="owner-control inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-xs font-extrabold uppercase tracking-wide text-white/80 hover:text-white">
            <RefreshCw className="h-4 w-4" aria-hidden /> {t("ow.refresh")}
          </button>
        </div>
      </header>

      {error ? <p className="mb-6 text-sm font-semibold text-red-300">{t("ow.execError")}</p> : null}

      <OwnerStagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <OwnerRise>
          <Kpi label="RevPAR" tip={t("ow.tip.revpar")} value={data ? formatBaht(data.revpar) : "…"} sub={t("ow.kpi.perAvailable")} />
        </OwnerRise>
        <OwnerRise>
          <Kpi label="ADR" tip={t("ow.tip.adr")} value={data ? formatBaht(data.adr) : "…"} sub={t("ow.kpi.perSold")} />
        </OwnerRise>
        <OwnerRise>
          <Kpi label={t("ow.occupancy")} tip={t("ow.tip.occ")} value={data ? `${data.occupancyPct}%` : "…"} sub={data ? `${data.roomNightsSold} / ${data.roomNightsAvailable} ${t("ow.kpi.roomNights")}` : ""} />
        </OwnerRise>
        <OwnerRise>
          <Kpi gold label={t("ow.kpi.net")} tip={t("ow.tip.net")} value={data ? formatBaht(data.netRevenue) : "…"} sub={data ? `${t("ow.kpi.commission")} ${formatBaht(data.commissionCost)}` : ""} />
        </OwnerRise>
      </OwnerStagger>

      <section className="owner-panel mb-6 rounded-2xl p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">{t("ow.exec.dailyH")}</h2>
            <p className="text-sm text-white/55">{t("ow.exec.dailySub")}</p>
          </div>
          {data ? (
            <p className="text-sm font-semibold text-white/70">
              {data.from} → {data.to} · {formatBaht(data.totalRevenue)}
            </p>
          ) : null}
        </div>
        <div className="flex h-44 items-end gap-[3px]" role="img" aria-label={t("ow.exec.dailyH")}>
          {(data?.series ?? []).map((p) => (
            <div key={p.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${p.date} · ${p.occupancy}% · ${formatBaht(p.revenue)}`}>
              <div
                className={cn("w-full rounded-t-sm transition", p.occupancy >= 80 ? "bg-gold" : p.occupancy >= 50 ? "bg-own-blue" : "bg-own-blue/45")}
                style={{ height: `${Math.max(3, (p.revenue / maxRevenue) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-5 text-xs font-bold text-white/70">
          <Legend color="bg-gold" label={t("ow.exec.lgHigh")} />
          <Legend color="bg-own-blue" label={t("ow.exec.lgMid")} />
          <Legend color="bg-own-blue/45" label={t("ow.exec.lgLow")} />
        </div>
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="owner-panel rounded-2xl p-6 md:p-8">
          <h2 className="mb-1 font-display text-xl font-semibold text-white">{t("ow.exec.mixH")}</h2>
          <p className="mb-5 text-sm text-white/55">{t("ow.exec.mixSub")}</p>
          <ul className="space-y-3">
            {(data?.channelMix ?? []).map((m) => {
              const share = data && data.totalRevenue ? Math.round((m.revenue / data.totalRevenue) * 100) : 0;
              return (
                <li key={m.source}>
                  <div className="mb-1 flex items-center justify-between text-sm font-bold text-white">
                    <span>
                      {m.source === "Direct" ? t("ow.direct") : m.source} <span className="text-white/50">· {m.bookings}</span>
                    </span>
                    <span>
                      {formatBaht(m.revenue)}
                      {m.commission > 0 ? <span className="ml-2 text-xs font-semibold text-red-300">−{formatBaht(m.commission)}</span> : null}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={cn("h-full rounded-full", m.source === "Direct" ? "bg-deal" : "bg-gold")} style={{ width: `${share}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-xs font-semibold text-white/60">
            {t("ow.exec.directShare", { n: data?.directSharePct ?? 0 })}
          </p>
        </section>

        <section className="owner-panel rounded-2xl p-6 md:p-8" data-payouts>
          <h2 className="mb-1 font-display text-xl font-semibold text-white">{t("ow.exec.payoutH")}</h2>
          <p className="mb-5 text-sm text-white/55">{t("ow.exec.payoutSub")}</p>
          <div className="grid grid-cols-3 gap-3">
            <Mini label={t("ow.exec.collected")} value={data ? formatBaht(data.payouts.collected) : "…"} tone="deal" />
            <Mini label={t("ow.exec.pendingWire")} value={data ? formatBaht(data.payouts.pendingWire) : "…"} tone="gold" />
            <Mini label={t("ow.exec.outstanding")} value={data ? formatBaht(data.payouts.outstanding) : "…"} />
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {(data?.payouts.byProvider ?? []).map((p) => (
              <li key={p.provider} className="flex justify-between border-t border-white/10 pt-2 text-white/80">
                <span>{providerLabel(p.provider, t)} · {p.count}</span>
                <span className="font-bold text-white">{formatBaht(p.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
            <Mini label={t("ow.exec.pickup")} value={data ? `${data.pickup7d.bookings} · ${formatBaht(data.pickup7d.revenue)}` : "…"} />
            <Mini label={t("ow.exec.forecast")} value={data ? `${data.forecast30d.occupancyPct}% · ${formatBaht(data.forecast30d.revenue)}` : "…"} />
          </div>
        </section>
      </div>

      <section className="owner-panel rounded-2xl p-6 md:p-8" data-reports>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">{t("ow.exec.reportsH")}</h2>
            <p className="text-sm text-white/55">{t("ow.exec.reportsSub")}</p>
          </div>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((k) => (
              <button
                key={k}
                type="button"
                disabled={busy}
                onClick={() => void generate(k)}
                className="owner-control inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-xs font-extrabold uppercase tracking-wide text-white/80 hover:text-white disabled:opacity-50"
              >
                <FileText className="h-4 w-4" aria-hidden /> {t(`ow.report.${k}`)}
              </button>
            ))}
          </div>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-white/55">{t("ow.exec.noReports")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-own-blue">
                <tr>
                  <th className="pb-2 pr-4">{t("ow.report.kind")}</th>
                  <th className="pb-2 pr-4">{t("ow.report.period")}</th>
                  <th className="pb-2 pr-4">{t("ow.occupancy")}</th>
                  <th className="pb-2 pr-4">ADR</th>
                  <th className="pb-2 pr-4">RevPAR</th>
                  <th className="pb-2 pr-4">{t("ow.kpi.net")}</th>
                  <th className="pb-2">{t("ow.exec.collected")}</th>
                </tr>
              </thead>
              <tbody className="text-white/85">
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="py-2 pr-4 font-bold capitalize">{t(`ow.report.${r.kind}`)}</td>
                    <td className="py-2 pr-4">
                      {r.periodStart} → {r.periodEnd}
                    </td>
                    <td className="py-2 pr-4">{r.summary.occupancyPct}%</td>
                    <td className="py-2 pr-4">{formatBaht(r.summary.adr)}</td>
                    <td className="py-2 pr-4">{formatBaht(r.summary.revpar)}</td>
                    <td className="py-2 pr-4">{formatBaht(r.summary.netRevenue)}</td>
                    <td className="py-2">{formatBaht(r.summary.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function providerLabel(provider: string, t: (k: string) => string): string {
  if (provider === "stripe") return "Stripe";
  if (provider === "promptpay") return "PromptPay";
  return t(`ow.prov.${provider}`);
}

function Kpi({ label, value, sub, tip, gold }: { label: string; value: string; sub?: string; tip?: string; gold?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-5 md:p-6", gold ? "bg-gold/15 text-white shadow-[0_12px_32px_rgba(0,0,0,.35),inset_0_1px_0_rgba(232,200,122,.25)]" : "owner-panel")}>
      <span className="mb-3 flex items-start justify-between gap-2">
        <b className={cn("block text-[0.68rem] font-extrabold uppercase tracking-[0.16em]", gold ? "text-gold" : "text-own-blue")}>{label}</b>
        {tip ? <InfoTip label={label} text={tip} /> : null}
      </span>
      <span className="font-display text-3xl font-semibold text-white md:text-4xl">{value}</span>
      {sub ? <p className={cn("mt-2 text-xs font-semibold", gold ? "text-gold/80" : "text-white/60")}>{sub}</p> : null}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "deal" | "gold" }) {
  return (
    <div className="owner-inset rounded-xl px-4 py-3">
      <b className="mb-1 block text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-own-blue">{label}</b>
      <span className={cn("font-display text-lg font-semibold", tone === "deal" ? "text-deal" : tone === "gold" ? "text-gold" : "text-white")}>{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <i className={cn("inline-block h-3 w-3 rounded", color)} aria-hidden />
      {label}
    </span>
  );
}
