"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/lib/currency";
import { daysBetweenIso } from "@/lib/stayDate";

/**
 * The room rail's running total · "฿3,900 x 2 nights ... ฿7,800", and what
 * booking direct saves. The one island inside a StaySearch form: it reads the
 * form's own date inputs (the form fires `tkh:stay` whenever they settle), so
 * the dates live in the form and nowhere else.
 *
 * It renders one night on the server, which is exactly the default stay the
 * form starts from (tomorrow to the day after), so hydration changes nothing.
 */
export function StayTotals({
  rate,
  ota,
  nightLabel,
  nightsLabel,
  saveLabel,
}: {
  rate: number;
  ota: number;
  nightLabel: string;
  nightsLabel: string;
  saveLabel: string;
}) {
  const { format } = useCurrency();
  const ref = useRef<HTMLDivElement>(null);
  const [nights, setNights] = useState(1);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const read = () => {
      const i = form.querySelector<HTMLInputElement>('input[name="in"]')?.value ?? "";
      const o = form.querySelector<HTMLInputElement>('input[name="out"]')?.value ?? "";
      const n = i && o ? daysBetweenIso(i, o) : 0;
      setNights(n > 0 ? n : 0);
    };
    read();
    form.addEventListener("tkh:stay", read);
    form.addEventListener("change", read);
    return () => {
      form.removeEventListener("tkh:stay", read);
      form.removeEventListener("change", read);
    };
  }, []);

  return (
    <div ref={ref} className="space-y-2 border-t border-line pt-4 text-sm">
      <div className="flex justify-between">
        <span>
          {format(rate)} x {nights} {nights > 1 ? nightsLabel : nightLabel}
        </span>
        <span className="font-semibold">{format(rate * nights)}</span>
      </div>
      <div className="flex justify-between text-deal">
        <span>{saveLabel}</span>
        <span className="font-bold">-{format((ota - rate) * nights)}</span>
      </div>
    </div>
  );
}
