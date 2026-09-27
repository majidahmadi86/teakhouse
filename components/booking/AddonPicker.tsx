"use client";

import { Check, Minus, Plus } from "lucide-react";
import type { Addon, AddonSelection } from "@/lib/addons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * v15 · Bespoke stay packages · helicopter transfer, private chef, spa
 * itinerary. Toggle cards; per-stay packages can be taken more than once.
 * Prices come from the same catalogue the server prices the booking with.
 */
export function AddonPicker({
  addons,
  selection,
  onChange,
  nights,
  guests,
  formatPrice,
}: {
  addons: Addon[];
  selection: AddonSelection[];
  onChange: (next: AddonSelection[]) => void;
  nights: number;
  guests: number;
  formatPrice: (thb: number) => string;
}) {
  const { t, tr } = useI18n();
  if (addons.length === 0) return null;

  const qtyOf = (key: string) => selection.find((s) => s.key === key)?.qty ?? 0;
  const set = (key: string, qty: number) => {
    const rest = selection.filter((s) => s.key !== key);
    onChange(qty > 0 ? [...rest, { key, qty: Math.min(10, qty) }] : rest);
  };

  return (
    <ul className="grid gap-3 sm:grid-cols-2" data-addon-picker>
      {addons.map((addon) => {
        const qty = qtyOf(addon.key);
        const on = qty > 0;
        const factor = addon.unit === "night" ? Math.max(1, nights) : addon.unit === "person" ? Math.max(1, guests) : 1;
        const lineTotal = addon.price * factor * (addon.unit === "stay" ? Math.max(1, qty) : 1);
        return (
          <li key={addon.key}>
            <div
              className={cn(
                "flex h-full flex-col overflow-hidden rounded-[14px] border-2 bg-white transition",
                on ? "border-blue shadow-[0_0_0_3px_rgba(10,108,222,0.14)]" : "border-line hover:border-blue/40"
              )}
            >
              <button
                type="button"
                onClick={() => set(addon.key, on ? 0 : 1)}
                aria-pressed={on}
                className="flex flex-1 gap-3 p-3.5 text-left"
                data-addon={addon.key}
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-cloud">
                  {addon.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={addon.image} alt="" width={80} height={64} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-display text-2xl text-gold">✦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-[1.02rem] leading-tight text-ink">{tr(addon.name)}</h4>
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                        on ? "border-blue bg-blue text-white" : "border-line text-transparent"
                      )}
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  </div>
                  <p className="mt-1 text-[0.76rem] leading-[1.6] text-sub">{tr(addon.description)}</p>
                  <p className="mt-1.5 text-[0.8rem] font-bold text-ink">
                    {formatPrice(addon.price)}{" "}
                    <span className="font-semibold text-sub">{t(`bk.pkg.unit.${addon.unit}`)}</span>
                  </p>
                </div>
              </button>
              {on ? (
                <div className="flex items-center justify-between border-t border-line bg-sky/40 px-3.5 py-2 text-[0.78rem] font-bold text-ink">
                  {addon.unit === "stay" ? (
                    <span className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => set(addon.key, qty - 1)}
                        className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white"
                        aria-label={t("bk.pkg.less")}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.2rem] text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => set(addon.key, qty + 1)}
                        className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white"
                        aria-label={t("bk.pkg.more")}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span className="text-sub">
                      {factor} × {formatPrice(addon.price)}
                    </span>
                  )}
                  <span className="text-blue">{formatPrice(lineTotal)}</span>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
