"use client";

import { format, type Locale } from "date-fns";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { useI18n } from "@/lib/i18n";
import { useOwner } from "@/lib/ownerStore";
import {
  addDaysIso,
  rateCalendarMonth,
  utcToIso,
  type NightRate,
  type PriceRule,
  type PriceRuleKind,
} from "@/lib/pricing";
import { addDays, cn, formatBaht } from "@/lib/utils";
import { dfLocale } from "@/lib/dateLocale";

/** Weekday headers come from date-fns so they follow the UI language. */
function weekdayLabels(dfl?: { locale: Locale }): string[] {
  const sunday = new Date(2024, 8, 1); // a known Sunday
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(sunday, i), "EEE", dfl)
  );
}

/** Colour by which layer set the night's price · the whole point of the grid. */
function sourceClass(source: NightRate["source"]): string {
  if (source === "override") return "bg-gold/25 ring-1 ring-gold/60";
  if (source === "season") return "bg-own-blue/30 ring-1 ring-own-blue/50";
  return "bg-white/[0.06]";
}

type RuleDraft = {
  kind: PriceRuleKind;
  label: string;
  startDate: string;
  endDate: string;
  /** "price" = fixed baht per night · "multiplier" = × the base rate */
  mode: "price" | "multiplier";
  amount: string;
};

function emptyDraft(kind: PriceRuleKind, startDate = ""): RuleDraft {
  return {
    kind,
    label: "",
    startDate,
    endDate: startDate,
    mode: kind === "override" ? "price" : "multiplier",
    amount: kind === "override" ? "" : "1.1",
  };
}

export default function OwnerRatesPage() {
  const { t, tr, lang } = useI18n();
  const dfl = dfLocale(lang);
  const { data, addPriceRule, deletePriceRule, updateRoom } = useOwner();
  const searchParams = useSearchParams();

  const rooms = useMemo(
    () => [...data.rooms].sort((a, b) => b.rate - a.rate),
    [data.rooms]
  );

  const [roomId, setRoomId] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month0: now.getMonth() };
  });
  const [draft, setDraft] = useState<RuleDraft>(() => emptyDraft("season"));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [baseDraft, setBaseDraft] = useState("");

  // Deep link from the rooms page · ?room=<id>, falling back to the first room.
  useEffect(() => {
    if (rooms.length === 0) return;
    setRoomId((prev) => {
      if (prev && rooms.some((r) => r.id === prev)) return prev;
      const wanted = searchParams.get("room");
      if (wanted && rooms.some((r) => r.id === wanted)) return wanted;
      return rooms[0].id;
    });
  }, [rooms, searchParams]);

  const room = rooms.find((r) => r.id === roomId) ?? null;

  useEffect(() => {
    setBaseDraft(room ? String(room.rate) : "");
  }, [room]);

  const rules = useMemo(
    () => data.priceRules.filter((r) => r.roomId === roomId),
    [data.priceRules, roomId]
  );

  const nights = useMemo(
    () =>
      room
        ? rateCalendarMonth(room.rate, month.year, month.month0, rules)
        : [],
    [room, month, rules]
  );

  // Month name follows the UI language · this was pinned to en-GB.
  const monthLabel = useMemo(
    () => format(new Date(month.year, month.month0, 1), "MMMM yyyy", dfl),
    [month, dfl]
  );

  const leadingBlanks = new Date(
    Date.UTC(month.year, month.month0, 1)
  ).getUTCDay();

  const spread = useMemo(() => {
    if (nights.length === 0) return null;
    const prices = nights.map((n) => n.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [nights]);

  function shiftMonth(delta: number) {
    setMonth((m) => {
      const d = new Date(Date.UTC(m.year, m.month0 + delta, 1));
      return { year: d.getUTCFullYear(), month0: d.getUTCMonth() };
    });
  }

  function saveBase() {
    if (!room) return;
    const value = Math.round(Number(baseDraft));
    if (!Number.isFinite(value) || value <= 0) {
      setMessage(t("ow.rateBaseInvalid"));
      return;
    }
    if (value === room.rate) return;
    updateRoom(room.id, { rate: value });
    setMessage(t("ow.rateBaseSaved"));
  }

  /** Clicking a date starts an override for exactly that day. */
  function startOverrideFor(dateIso: string) {
    setMessage("");
    setDraft(emptyDraft("override", dateIso));
    document
      .getElementById("rate-rule-form")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitRule() {
    if (!room) return;
    const amount = Number(draft.amount);
    if (!draft.startDate || !draft.endDate) {
      setMessage(t("ow.rateDatesRequired"));
      return;
    }
    if (draft.endDate < draft.startDate) {
      setMessage(t("ow.rateEndBeforeStart"));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(t("ow.rateAmountRequired"));
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await addPriceRule({
        roomId: room.id,
        kind: draft.kind,
        label: draft.label.trim(),
        startDate: draft.startDate,
        endDate: draft.endDate,
        price: draft.mode === "price" ? Math.round(amount) : null,
        multiplier: draft.mode === "multiplier" ? amount : null,
      });
      setDraft(emptyDraft(draft.kind));
      setMessage(t("ow.rateSaved"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("ow.rateSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function removeRule(rule: PriceRule) {
    if (!window.confirm(t("ow.sure"))) return;
    setBusy(true);
    try {
      await deletePriceRule(rule.id);
      setMessage(t("ow.rateDeleted"));
    } finally {
      setBusy(false);
    }
  }

  const roomOptions = rooms.map((r) => ({ value: r.id, label: tr(r.name) }));
  const todayIso = utcToIso(Date.now());

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">
            {t("ow.rateCalendar")}
          </h1>
          <p className="mt-1 text-sm text-white/55">{t("ow.rateLead")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="owner-control flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[160px] text-center font-display text-lg font-semibold text-white">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="owner-control flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white transition"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="owner-panel mb-6 grid gap-4 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-[1fr_220px_1fr] lg:items-end">
        <OwnerListbox
          label={t("col.room")}
          value={roomId}
          onChange={setRoomId}
          options={roomOptions}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-white/80">
            {t("ow.rateBase")}
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              step="50"
              inputMode="numeric"
              value={baseDraft}
              onChange={(e) => setBaseDraft(e.target.value)}
              onBlur={saveBase}
              className="min-h-[44px] w-full px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={saveBase}
              className="owner-control min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold text-white"
            >
              {t("ow.save")}
            </button>
          </div>
        </label>

        {spread ? (
          <p className="text-sm font-semibold text-white/70">
            {spread.min === spread.max
              ? t("ow.rateFlat", { p: formatBaht(spread.min) })
              : t("ow.rateSpread", {
                  lo: formatBaht(spread.min),
                  hi: formatBaht(spread.max),
                })}
          </p>
        ) : null}
      </div>

      <section className="owner-panel mb-6 rounded-2xl p-4 md:p-6">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekdayLabels(dfl).map((d) => (
            <div
              key={d}
              className="text-center text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-white/55"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {nights.map((night) => {
            const day = Number(night.date.slice(8));
            return (
              <button
                key={night.date}
                type="button"
                onClick={() => startOverrideFor(night.date)}
                title={`${night.date} · ${formatBaht(night.price)}${
                  night.label ? ` · ${night.label}` : ""
                }`}
                className={cn(
                  "flex min-h-[62px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition hover:ring-2 hover:ring-white/40",
                  sourceClass(night.source),
                  night.date === todayIso && "outline outline-2 outline-gold"
                )}
              >
                <span className="text-xs font-bold text-white/80">{day}</span>
                <span className="text-[0.72rem] font-extrabold text-white">
                  {formatBaht(night.price)}
                </span>
                {night.label ? (
                  <span className="w-full truncate text-center text-[0.55rem] font-semibold text-white/60">
                    {night.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-white/70">
          <LegendDot color="bg-white/[0.06]" label={t("ow.rateLegendBase")} />
          <LegendDot color="bg-own-blue/30" label={t("ow.rateLegendSeason")} />
          <LegendDot color="bg-gold/25" label={t("ow.rateLegendOverride")} />
        </div>
        <p className="mt-3 text-xs font-medium text-white/55">
          {t("ow.rateGridHint")}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="owner-panel rounded-2xl p-4 md:p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-white">
            {t("ow.rateRules")}
          </h2>
          {rules.length === 0 ? (
            <p className="text-sm text-white/55">{t("ow.rateNoRules")}</p>
          ) : (
            <ul className="space-y-2">
              {rules
                .slice()
                .sort(
                  (a, b) =>
                    a.kind.localeCompare(b.kind) ||
                    a.startDate.localeCompare(b.startDate)
                )
                .map((rule) => (
                  <li
                    key={rule.id}
                    className="owner-inset flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-bold text-white">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide",
                            rule.kind === "override"
                              ? "bg-gold/25 text-gold"
                              : "bg-own-blue/30 text-own-blue"
                          )}
                        >
                          {rule.kind === "override"
                            ? t("ow.rateOverride")
                            : t("ow.rateSeason")}
                        </span>
                        {rule.label || t("ow.rateUnnamed")}
                      </p>
                      <p className="mt-1 text-white/60">
                        {rule.startDate} → {rule.endDate}
                      </p>
                      <p className="mt-0.5 font-bold text-gold">
                        {rule.price != null
                          ? formatBaht(rule.price)
                          : `×${rule.multiplier}${
                              room
                                ? ` · ${formatBaht(
                                    Math.round(room.rate * (rule.multiplier ?? 1))
                                  )}`
                                : ""
                            }`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeRule(rule)}
                      className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                      aria-label={`${t("ow.del")} ${rule.label || rule.startDate}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section id="rate-rule-form" className="owner-panel rounded-2xl p-4 md:p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-white">
            {t("ow.rateAdd")}
          </h2>

          <div
            className="owner-inset mb-4 flex rounded-xl p-1"
            role="group"
            aria-label={t("ow.rateKind")}
          >
            {(["season", "override"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...emptyDraft(kind, d.startDate),
                    label: d.label,
                    endDate: kind === "override" ? d.startDate : d.endDate,
                  }))
                }
                className={cn(
                  "min-h-[40px] flex-1 rounded-lg px-3 text-sm font-bold transition",
                  draft.kind === kind
                    ? "bg-own-blue text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                {kind === "season" ? t("ow.rateSeason") : t("ow.rateOverride")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-white/80">
                {t("ow.rateLabel")}
              </span>
              <input
                value={draft.label}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, label: e.target.value }))
                }
                placeholder={
                  draft.kind === "override" ? "Songkran" : "High season"
                }
                className="min-h-[44px] w-full px-3 py-2 text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-white/80">
                  {t("avail.in")}
                </span>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      startDate: e.target.value,
                      // An override is one day by default · keep end in step.
                      endDate:
                        d.kind === "override" || d.endDate < e.target.value
                          ? e.target.value
                          : d.endDate,
                    }))
                  }
                  className="min-h-[44px] w-full px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-white/80">
                  {t("avail.out")}
                </span>
                <input
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate || undefined}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, endDate: e.target.value }))
                  }
                  className="min-h-[44px] w-full px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div
              className="owner-inset flex rounded-xl p-1"
              role="group"
              aria-label={t("ow.rateMode")}
            >
              {(["price", "multiplier"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      mode,
                      amount: mode === "multiplier" ? "1.1" : "",
                    }))
                  }
                  className={cn(
                    "min-h-[40px] flex-1 rounded-lg px-3 text-sm font-bold transition",
                    draft.mode === mode
                      ? "bg-own-blue text-white"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {mode === "price" ? t("ow.rateFixed") : t("ow.rateMultiplier")}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-white/80">
                {draft.mode === "price"
                  ? t("ow.rateFixedLabel")
                  : t("ow.rateMultiplierLabel")}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={draft.mode === "price" ? "1" : "0.1"}
                step={draft.mode === "price" ? "50" : "0.05"}
                value={draft.amount}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, amount: e.target.value }))
                }
                placeholder={draft.mode === "price" ? "4500" : "1.1"}
                className="min-h-[44px] w-full px-3 py-2 text-sm"
              />
              {room && draft.mode === "multiplier" && Number(draft.amount) > 0 ? (
                <span className="mt-1.5 block text-xs font-semibold text-gold">
                  {formatBaht(Math.round(room.rate * Number(draft.amount)))}
                </span>
              ) : null}
            </label>

            <button
              type="button"
              disabled={busy}
              onClick={() => void submitRule()}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6] disabled:opacity-60"
            >
              <Plus className="h-5 w-5" aria-hidden />
              {t("ow.rateAddBtn")}
            </button>

            {message ? (
              <p className="text-xs font-semibold text-deal" role="status">
                {message}
              </p>
            ) : null}
          </div>
        </section>
      </div>
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
