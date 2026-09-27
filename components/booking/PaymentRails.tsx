"use client";

import { useEffect, useState } from "react";
import { Bitcoin, CreditCard, Landmark, QrCode } from "lucide-react";
import type { Rail } from "@/lib/payments";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type RailStatus = Record<Rail, { enabled: boolean; live: boolean }>;

const RAILS: { rail: Rail; icon: typeof QrCode; key: string }[] = [
  { rail: "promptpay", icon: QrCode, key: "promptpay" },
  { rail: "card", icon: CreditCard, key: "card" },
  { rail: "wire", icon: Landmark, key: "wire" },
  { rail: "crypto", icon: Bitcoin, key: "crypto" },
];

/**
 * v15 · How the guest pays. No card fields on this page, ever · cards, Apple
 * Pay and Google Pay go to Stripe's hosted page (PCI SAQ-A), PromptPay is a
 * real QR, wire shows the house's account, crypto is a hosted charge.
 */
export function PaymentRails({
  value,
  onChange,
  status,
}: {
  value: Rail;
  onChange: (rail: Rail) => void;
  status: RailStatus | null;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label={t("bk.pay.how")}>
      {RAILS.map(({ rail, icon: Icon, key }) => {
        const live = status?.[rail]?.live ?? false;
        const active = value === rail;
        return (
          <button
            key={rail}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(rail)}
            data-rail={rail}
            className={cn(
              "flex min-h-[92px] flex-col items-start justify-between rounded-[12px] border-2 p-3 text-left transition",
              active ? "border-blue bg-sky/40" : "border-line bg-white hover:border-blue/40"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-blue" : "text-sub")} aria-hidden />
            <span>
              <span className="block text-[0.86rem] font-extrabold text-ink">{t(`bk.rail.${key}`)}</span>
              <span className="block text-[0.68rem] font-semibold text-sub">{t(`bk.rail.${key}.sub`)}</span>
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wide",
                live ? "bg-deal-bg text-deal" : "bg-cloud text-strike"
              )}
            >
              {live ? t("bk.rail.live") : t("bk.rail.demo")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A scannable PromptPay QR rendered from the EMVCo payload · lazy, client only. */
export function PromptPayQr({ payload, size = 176 }: { payload: string; size?: number }) {
  const [svg, setSvg] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then(async (qr) => {
      const out = await qr.toString(payload, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      if (!cancelled) setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);
  return (
    <div
      className="grid place-items-center rounded-xl border border-line bg-white p-2"
      style={{ width: size + 16, height: size + 16 }}
      data-promptpay-qr
    >
      {svg ? (
        <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="h-full w-full animate-pulse rounded bg-cloud" style={{ width: size, height: size }} />
      )}
    </div>
  );
}
