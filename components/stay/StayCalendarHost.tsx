"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StayPickerLabels } from "@/components/stay/StayPicker";
import { useCurrency } from "@/lib/currency";
import { addDays, isComplete, isDayIso, nightsOf, orderedStay, type DayIso, type RangeFocus, type StayRange } from "@/lib/dateRange";
import type { Lang } from "@/lib/locales/meta";
import { hotelDayIso } from "@/lib/stayDate";

type Open = {
  form: HTMLFormElement;
  anchor: HTMLElement;
  focus: RangeFocus;
  /** The stay the form held when the picker opened. */
  before: { from: DayIso; to: DayIso } | null;
};

// The calendar's code loads on the first open (and is warmed once the page is
// idle), so a page that never opens it ships only this small listener.
const loadPicker = () => import("@/components/stay/StayPicker").then((m) => m.StayPicker);
const StayPicker = dynamic(loadPicker, { ssr: false });

let ratesPromise: Promise<Record<string, number>> | null = null;

function loadRates(today: DayIso): Promise<Record<string, number>> {
  if (!ratesPromise) {
    ratesPromise = fetch(`/api/rates?start=${today}&days=93`)
      .then((r) => (r.ok ? r.json() : { nights: {} }))
      .then((j: { nights?: Record<string, number> }) => j.nights ?? {})
      .catch(() => ({}));
  }
  return ratesPromise;
}

function readForm(form: HTMLFormElement): { from: DayIso; to: DayIso } | null {
  const i = form.querySelector<HTMLInputElement>('input[name="in"]')?.value;
  const o = form.querySelector<HTMLInputElement>('input[name="out"]')?.value;
  if (!isDayIso(i)) return null;
  return orderedStay(i, isDayIso(o) ? o : null);
}

function writeForm(form: HTMLFormElement, stay: { from: DayIso; to: DayIso }) {
  const i = form.querySelector<HTMLInputElement>('input[name="in"]');
  const o = form.querySelector<HTMLInputElement>('input[name="out"]');
  if (i) i.value = stay.from;
  if (o) o.value = stay.to;
  const w = window as unknown as { __tkhStay?: (f: HTMLFormElement) => void };
  w.__tkhStay?.(form);
}

/**
 * The booking bar's calendar · ONE small island per page that serves every
 * StaySearch form on it (the hero, the strip under the header, a room's rail).
 *
 * The forms stay plain server HTML with native date inputs (they work with
 * scripting off). Once this island is up it marks <html data-cal-ready>,
 * which hands the date fields' clicks to it instead of the native pickers,
 * and opens the range calendar (components/stay/StayPicker) anchored to the
 * form's date box. The chosen stay is written back into the form's own
 * inputs, so "Check rates" submits exactly what the guest sees, and /book
 * opens with it already applied.
 */
export function StayCalendarHost({ lang, labels }: { lang: Lang; labels: StayPickerLabels }) {
  const [open, setOpen] = useState<Open | null>(null);
  const [value, setValue] = useState<StayRange>({ from: null, to: null });
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [today, setToday] = useState<DayIso>(() => hotelDayIso());
  const { format } = useCurrency();
  const openRef = useRef<Open | null>(null);
  openRef.current = open;

  const show = useCallback((form: HTMLFormElement, focus: RangeFocus) => {
    const anchor = form.querySelector<HTMLElement>("[data-stay-dates]") ?? form;
    const before = readForm(form);
    const t = hotelDayIso();
    setToday(t);
    setValue(before ? { from: before.from, to: before.to } : { from: null, to: null });
    setOpen({ form, anchor, focus, before });
    loadRates(t).then(setRates);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-cal-ready", "");
    const fieldOf = (t: EventTarget | null) =>
      (t as HTMLElement | null)?.closest?.<HTMLElement>("[data-stay-search] [data-stay-field]") ?? null;

    const onClick = (e: MouseEvent) => {
      const field = fieldOf(e.target);
      if (!field) return;
      const form = field.closest("form");
      if (!form) return;
      e.preventDefault();
      show(form, field.getAttribute("data-stay-field") === "out" ? "out" : "in");
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !el.matches?.("[data-stay-search] input.stay-date")) return;
      if (e.key !== "Enter" && e.key !== " " && e.key !== "ArrowDown") return;
      const form = el.closest("form");
      if (!form) return;
      e.preventDefault();
      show(form, (el as HTMLInputElement).name === "out" ? "out" : "in");
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    const warm = () => void loadPicker();
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(warm) : window.setTimeout(warm, 2500);
    return () => {
      void idle;
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      document.documentElement.removeAttribute("data-cal-ready");
    };
  }, [show]);

  const close = useCallback((final: StayRange) => {
    const cur = openRef.current;
    if (!cur) return;
    if (isComplete(final)) {
      writeForm(cur.form, { from: final.from, to: final.to });
    } else if (final.from) {
      // Only a new arrival was chosen: keep the stay's length from there.
      const length = cur.before ? Math.max(1, nightsOf(cur.before.from, cur.before.to)) : 1;
      writeForm(cur.form, { from: final.from, to: addDays(final.from, length) });
    }
    setOpen(null);
    // Back to the field the guest came from.
    const field = cur.form.querySelector<HTMLInputElement>(`input[name="${cur.focus === "out" ? "out" : "in"}"]`);
    field?.focus({ preventScroll: true });
  }, []);

  const priceFor = useCallback((iso: DayIso) => (rates ? rates[iso] ?? null : null), [rates]);

  if (!open) return null;
  return (
    <StayPicker
      lang={lang}
      open
      anchor={open?.anchor ?? null}
      value={value}
      focus={open?.focus ?? "in"}
      today={today}
      onChange={setValue}
      onClose={close}
      labels={labels}
      priceFor={rates ? priceFor : undefined}
      formatPrice={format}
    />
  );
}
