"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, Users } from "lucide-react";
import { BookingDock } from "@/components/booking/BookingDock";
import { MediaPicture } from "@/components/MediaPicture";
import { generateBookingCode, qrMockSvg } from "@/lib/bookingUtils";
import { useCurrency } from "@/lib/currency";
import { isComplete, nightsOf, type DayIso, type StayRange } from "@/lib/dateRange";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";
import { formatDay, nightsLabel } from "@/lib/i18n-core";
import { bookableRooms, type BookableRoom } from "@/lib/liveRooms";
import { useGuestPriceRulesByRoom, useGuestRooms, useOwner } from "@/lib/ownerStore";
import { groupNights, otaEquivalent, quoteStay } from "@/lib/pricing";
import type { MediaProps } from "@/lib/roomMedia";
import { catalogueRoom, type Room } from "@/lib/rooms";
import { hotelDayIso, MAX_GUESTS, type Stay } from "@/lib/stayDate";
import { cn } from "@/lib/utils";

const StayPicker = dynamic(() => import("@/components/stay/StayPicker").then((m) => m.StayPicker), {
  ssr: false,
});
const Receipt = dynamic(() => import("@/components/booking/Receipt").then((m) => m.Receipt), { ssr: false });

type PayMethod = "promptpay" | "card";
type Step = 1 | 2 | 3;

const DEPOSIT_PCT = 30;

/**
 * /book · the booking flow (v17 A4): Room → Details → Confirmed.
 *
 * The stay arrives from the server (the URL's in/out/g/room, lib/stayDate),
 * so a guest who pressed "Check rates" anywhere lands straight on the room
 * list with their dates and guests applied · nothing to pick again. The
 * dates stay editable at the top (the same range calendar as the booking
 * bar), and one dock (components/booking/BookingDock) carries the room,
 * dates, nights, total, deposit and the next action at every width, so the
 * next step is never below the fold.
 *
 * Room content comes from the catalogue (lib/rooms.ts); rates and rate rules
 * from the live store laid over it by slug (lib/liveRooms.ts), so a database
 * that does not know a room yet prices it at the catalogue's base rate.
 */
export default function BookPageClient({
  initialStay,
  media,
}: {
  initialStay: Stay;
  media: Record<string, MediaProps | null>;
}) {
  const { t, tr, lang } = useI18n();
  const { format } = useCurrency();
  const { user, attachBooking } = useGuestAuth();
  const dbRooms = useGuestRooms();
  const rulesByRoom = useGuestPriceRulesByRoom();
  const { addBooking, hydrated: rulesLoaded } = useOwner();
  const rooms = useMemo(() => bookableRooms(dbRooms), [dbRooms]);

  const topRef = useRef<HTMLDivElement>(null);
  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const initialRoom = catalogueRoom(initialStay.room);
  const [step, setStep] = useState<Step>(1);
  const [stay, setStay] = useState<{ from: DayIso; to: DayIso }>({ from: initialStay.in, to: initialStay.out });
  const [draft, setDraft] = useState<StayRange>({ from: initialStay.in, to: initialStay.out });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guests, setGuests] = useState(initialStay.guests);
  const [roomSlug, setRoomSlug] = useState<string | null>(initialRoom?.slug ?? null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("promptpay");
  const [code, setCode] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean; phone?: boolean }>({});

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  // A room chosen on a room page is shown selected, in view.
  useEffect(() => {
    if (!initialRoom) return;
    const id = requestAnimationFrame(() => {
      const el = document.getElementById(`room-${initialRoom.slug}`);
      if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The address bar follows the stay, so a reload or a shared link keeps it.
  useEffect(() => {
    const q = new URLSearchParams({ in: stay.from, out: stay.to, g: String(guests) });
    if (roomSlug) q.set("room", roomSlug);
    try {
      window.history.replaceState(window.history.state, "", `/book?${q.toString()}`);
    } catch {
      /* ignore */
    }
  }, [stay, guests, roomSlug]);

  const nights = nightsOf(stay.from, stay.to);
  const selected: BookableRoom | null = roomSlug ? rooms.find((r) => r.slug === roomSlug) ?? null : null;

  const quoteFor = useCallback(
    (room: BookableRoom) => quoteStay(room.rate, stay.from, stay.to, rulesByRoom[room.id] ?? []),
    [stay, rulesByRoom]
  );

  const quote = useMemo(() => (selected ? quoteFor(selected) : null), [selected, quoteFor]);
  const rateLines = useMemo(() => (quote ? groupNights(quote.nights) : []), [quote]);
  const subtotal = quote?.total ?? 0;
  const savings = selected && quote ? Math.max(0, otaEquivalent(quote.total, selected.rate, selected.ota) - quote.total) : 0;
  const deposit = Math.round((subtotal * DEPOSIT_PCT) / 100);
  const balance = subtotal - deposit;

  const fits = (room: BookableRoom) => guests <= room.capacity;

  function goStep(next: Step) {
    setStep(next);
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function selectRoom(room: BookableRoom) {
    setRoomSlug(room.slug);
  }

  function closePicker(final: StayRange) {
    setPickerOpen(false);
    if (isComplete(final)) {
      setStay({ from: final.from, to: final.to });
      setDraft(final);
    } else {
      setDraft({ from: stay.from, to: stay.to });
    }
    dateBtnRef.current?.focus({ preventScroll: true });
  }

  function validate(): boolean {
    const next = {
      name: name.trim().length === 0,
      email: !/^\S+@\S+\.\S+$/.test(email.trim()),
      phone: phone.trim().length < 6,
    };
    setErrors(next);
    const first = next.name ? nameRef.current : next.email ? emailRef.current : next.phone ? phoneRef.current : null;
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function pay() {
    if (!selected) return;
    if (!validate()) return;
    const bookingCode = generateBookingCode();
    const id = `bk-${Date.now()}`;
    addBooking({
      id,
      code: bookingCode,
      guest: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      roomSlug: selected.slug,
      checkIn: stay.from,
      checkOut: stay.to,
      source: "Direct",
      amount: subtotal,
      status: "ok",
      notes: requests.trim(),
    });
    if (user) attachBooking(id);
    setBookingId(id);
    setCode(bookingCode);
    goStep(3);
  }

  const steps = [t("bk.s1"), t("bk.s2"), t("bk.s3")];
  const action =
    step === 1
      ? {
          label: t("bk.continue"),
          onClick: () => selected && goStep(2),
          disabled: !selected || !fits(selected),
        }
      : {
          label: `${t("bk.pay")} ${rulesLoaded ? format(deposit) : ""}`.trim(),
          onClick: pay,
          disabled: !selected,
        };
  const hint = step === 1 && !selected ? t("bk.dockEmpty") : undefined;

  // The receipt needs the DB-shaped room.
  const receiptRoom: Room | null = selected
    ? {
        id: selected.id,
        slug: selected.slug,
        shortKey: selected.shortKey,
        name: selected.name,
        rate: selected.rate,
        ota: selected.ota,
        meta: selected.summary,
        description: selected.description,
        photos: [],
        amenities: selected.amenities,
        capacity: selected.capacity,
        bedType: selected.beds,
        sizeM2: selected.sizeM2,
        view: selected.view,
        floor: selected.floor,
        bathtub: selected.bathtub,
        balcony: selected.balcony,
        pets: false,
        active: true,
      }
    : null;

  const stayLabel = `${formatDay(lang, stay.from)} → ${formatDay(lang, stay.to)}`;

  return (
    <>
      <section className="px-4 pb-40 pt-6 sm:px-8 md:pt-8 lg:pb-24 print:pt-4">
        <div ref={topRef} className="mx-auto max-w-site scroll-mt-[calc(var(--demo-bar-h)+var(--header-h)+1rem)]">
          <div
            className={cn(
              "grid gap-8 lg:items-start lg:gap-10",
              step < 3 && "lg:grid-cols-[minmax(0,1fr)_380px]"
            )}
          >
            <div className="min-w-0">
          <div className={cn("print:hidden", step === 3 && "max-lg:hidden")}>
                <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                  <div>
                    <p className="eyebrow max-sm:hidden">{t("bk.eyebrow")}</p>
                    <h1 className="mt-2 text-[clamp(1.9rem,3vw,2.75rem)]">{t("bk.h1")}</h1>
                  </div>
                  <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] sm:gap-3 sm:text-[13.5px]" aria-label={t("a11y.bookingSteps")}>
                    {steps.map((label, i) => {
                      const n = (i + 1) as Step;
                      const done = n < step;
                      const current = n === step;
                      return (
                        <li key={label} className="flex items-center gap-1.5 sm:gap-3" aria-current={current ? "step" : undefined}>
                          <button
                            type="button"
                            disabled={!done || step === 3}
                            onClick={() => goStep(n)}
                            className={cn(
                              "inline-flex items-center gap-1.5 whitespace-nowrap sm:gap-2",
                              current ? "font-semibold text-ink" : done ? "text-ink/80 hover:text-ink" : "text-sub"
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-6 w-6 place-items-center rounded-full border text-[12px]",
                                current
                                  ? "border-forest bg-forest text-white"
                                  : done
                                    ? "border-forest text-forest"
                                    : "border-line text-sub"
                              )}
                            >
                              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}
                            </span>
                            {label}
                          </button>
                          {i < steps.length - 1 ? <span className="h-px w-3 bg-line min-[400px]:w-5 sm:w-8" aria-hidden /> : null}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
              <div className="mt-6 lg:mt-7" />
              {step === 1 ? (
                <>
                  {/* The stay · always editable, never asked for twice. */}
                  <div className="flex items-stretch gap-1 rounded-card border border-line/80 bg-white p-1.5 shadow-soft sm:gap-2 sm:p-2 print:hidden">
                    <button
                      ref={dateBtnRef}
                      type="button"
                      data-date-trigger
                      data-date-shell
                      aria-haspopup="dialog"
                      aria-expanded={pickerOpen}
                      aria-label={`${t("avail.selectDates")}: ${stayLabel}, ${nightsLabel(lang, nights)}`}
                      onClick={() => {
                        setDraft({ from: stay.from, to: stay.to });
                        setPickerOpen(true);
                      }}
                      className="flex min-h-[60px] min-w-0 flex-1 items-center gap-3 rounded-soft px-3 py-2 text-start transition hover:bg-stone sm:px-4"
                    >
                      <CalendarDays className="hidden h-5 w-5 shrink-0 text-teak sm:block" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium leading-snug text-ink sm:text-[15.5px]">{stayLabel}</span>
                        <span className="block text-[13px] text-sub">{nightsLabel(lang, nights)}</span>
                      </span>
                      <span className="ms-auto hidden text-[13.5px] font-medium text-forest underline decoration-forest/30 underline-offset-4 sm:inline">
                        {t("bk.change")}
                      </span>
                    </button>
                    <label className="relative flex min-h-[60px] w-[118px] shrink-0 items-center gap-2 rounded-soft border-s border-line px-3 transition hover:bg-stone sm:w-[210px] sm:gap-3 sm:px-4">
                      <Users className="hidden h-5 w-5 shrink-0 text-teak sm:block" aria-hidden />
                      <span className="sr-only">{t("avail.guests")}</span>
                      <select
                        data-guests
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="h-full w-full cursor-pointer appearance-none bg-transparent pe-6 text-[15px] font-medium text-ink outline-none sm:text-[15.5px]"
                      >
                        {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {t(`g${n}` as "g1")}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute end-3 h-4 w-4 text-sub sm:end-4" aria-hidden />
                    </label>
                  </div>

                  <div className="mt-7 flex flex-wrap items-baseline justify-between gap-2 sm:mt-8">
                    <h2 className="text-[clamp(1.6rem,2.2vw,1.9rem)]">{t("bk.choose")}</h2>
                    <p className="text-[14px] text-sub">{t("bk.chooseLead")}</p>
                  </div>

                  <ul className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
                    {rooms.map((room, i) => {
                      const isSel = room.slug === roomSlug;
                      const ok = fits(room);
                      const total = rulesLoaded ? quoteFor(room).total : null;
                      const m = media[room.slug];
                      return (
                        <li
                          key={room.slug}
                          id={`room-${room.slug}`}
                          className={cn(
                            "scroll-mt-32 overflow-hidden rounded-card border bg-white transition duration-300",
                            isSel ? "border-forest shadow-lift ring-1 ring-forest" : "border-line/80 shadow-soft hover:shadow-lift"
                          )}
                        >
                          <div className="grid grid-cols-[108px_minmax(0,1fr)] sm:grid-cols-[minmax(0,260px)_1fr] md:grid-cols-[minmax(0,300px)_1fr]">
                            <div className="relative ms-3 mt-3 aspect-[4/5] overflow-hidden rounded-soft bg-ivory sm:m-0 sm:aspect-auto sm:min-h-[220px] sm:rounded-none">
                              {m ? (
                                <MediaPicture
                                  media={m}
                                  alt={tr(m.alt)}
                                  sizes="(max-width: 639px) 108px, 300px"
                                  priority={i < 2}
                                />
                              ) : null}
                            </div>
                            <div className="flex min-w-0 flex-col p-4 sm:p-5 md:p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h3 className="font-display text-[19px] leading-snug text-ink sm:text-[22px]">{tr(room.name)}</h3>
                                  <p className="mt-1 text-[13px] text-sub sm:text-[14px]">{tr(room.summary)}</p>
                                </div>
                                {isSel ? (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-soft bg-forest-soft px-2.5 py-1 text-[12.5px] font-semibold text-forest">
                                    <Check className="h-3.5 w-3.5" aria-hidden />
                                    {t("bk.selected")}
                                  </span>
                                ) : null}
                              </div>
                              <ul className="mt-3 hidden flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink/80 sm:flex">
                                {room.highlights.map((h) => (
                                  <li key={h.en} className="flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-teak-light" aria-hidden />
                                    {tr(h)}
                                  </li>
                                ))}
                              </ul>
                              <details className="group mt-2 text-[14px]">
                                <summary className="inline-flex cursor-pointer list-none items-center gap-1 py-1 font-medium text-ink/80 underline decoration-line underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
                                  {t("bk.viewDetails")}
                                  <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden />
                                </summary>
                                <p className="mt-2 leading-relaxed text-ink/80">{tr(room.description)}</p>
                                <ul className="mt-3 grid gap-1 text-ink/80 sm:grid-cols-2">
                                  {room.inclusions.map((inc) => (
                                    <li key={inc.en} className="flex gap-2">
                                      <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden />
                                      {tr(inc)}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                              <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-3 sm:pt-4">
                                <div className="min-h-[44px]">
                                  <p className="text-[13px] text-sub">
                                    {t("room.from")} <span className="font-medium text-ink">{format(room.rate)}</span>{" "}
                                    {t("room.night")}
                                  </p>
                                  {total != null ? (
                                    <p className="text-[18px] font-semibold text-ink">
                                      {format(total)}{" "}
                                      <span className="text-[13px] font-normal text-sub">
                                        {t("bk.totalFor", { nights: nightsLabel(lang, nights) })}
                                      </span>
                                    </p>
                                  ) : null}
                                  {!ok ? (
                                    <p className="text-[13px] text-coral-deep">{t("bk.tooMany", { n: room.capacity })}</p>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  disabled={!ok}
                                  onClick={() => selectRoom(room)}
                                  aria-pressed={isSel}
                                  className={cn(isSel ? "btn-secondary" : "btn-primary", "min-h-11 px-6 max-sm:w-full")}
                                >
                                  {isSel ? t("bk.selected") : t("bk.select")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}

              {step === 2 && selected ? (
                <div className="space-y-10 print:hidden">
                  <section>
                    <h2 className="text-[clamp(1.6rem,2.4vw,2.1rem)]">{t("bk.details")}</h2>
                    <p className="mt-2 text-[15px] text-sub">{t("bk.detailsLead")}</p>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <Field label={t("bk.name")} error={errors.name ? t("bk.errName") : undefined} className="sm:col-span-2">
                        <input
                          ref={nameRef}
                          value={name}
                          autoComplete="name"
                          onChange={(e) => {
                            setName(e.target.value);
                            setErrors((f) => ({ ...f, name: false }));
                          }}
                          placeholder={t("bk.nameph")}
                          aria-invalid={errors.name || undefined}
                          className={inputClass}
                        />
                      </Field>
                      <Field label={t("bk.mail")} error={errors.email ? t("bk.errMail") : undefined}>
                        <input
                          ref={emailRef}
                          type="email"
                          value={email}
                          autoComplete="email"
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setErrors((f) => ({ ...f, email: false }));
                          }}
                          placeholder="you@example.com"
                          aria-invalid={errors.email || undefined}
                          className={inputClass}
                        />
                      </Field>
                      <Field label={t("bk.phone")} error={errors.phone ? t("bk.errPhone") : undefined}>
                        <input
                          ref={phoneRef}
                          type="tel"
                          value={phone}
                          autoComplete="tel"
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setErrors((f) => ({ ...f, phone: false }));
                          }}
                          placeholder="+66 81 234 5678"
                          aria-invalid={errors.phone || undefined}
                          className={inputClass}
                        />
                      </Field>
                      <Field label={`${t("bk.requests")} · ${t("bk.optional")}`} className="sm:col-span-2">
                        <textarea
                          value={requests}
                          onChange={(e) => setRequests(e.target.value)}
                          rows={2}
                          placeholder={t("bk.requestsPh")}
                          className={cn(inputClass, "resize-y")}
                        />
                      </Field>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-[clamp(1.6rem,2.4vw,2.1rem)]">{t("bk.payment")}</h2>
                    <p className="mt-2 text-[15px] text-sub">{t("bk.payLead")}</p>
                    <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("bk.payment")}>
                      {(["promptpay", "card"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={payMethod === m}
                          onClick={() => setPayMethod(m)}
                          className={cn(
                            "min-h-[56px] rounded-soft border px-4 text-[15px] font-medium transition",
                            payMethod === m ? "border-forest bg-forest-soft text-ink ring-1 ring-forest" : "border-line bg-white text-ink/80 hover:border-ink/30"
                          )}
                        >
                          {m === "promptpay" ? "PromptPay" : t("bk.card")}
                        </button>
                      ))}
                    </div>
                    {payMethod === "promptpay" ? (
                      <div className="mt-5 flex items-center gap-5 rounded-card border border-line/80 bg-white p-5">
                        <svg
                          width="112"
                          height="112"
                          viewBox="0 0 21 21"
                          shapeRendering="crispEdges"
                          aria-hidden
                          className="shrink-0"
                          dangerouslySetInnerHTML={{ __html: qrMockSvg() }}
                        />
                        <p className="text-[14.5px] text-ink/80">{t("bk.scan")}</p>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Field label={t("bk.cardNum")} className="sm:col-span-2">
                          <input inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" className={inputClass} />
                        </Field>
                        <Field label={t("bk.expiry")}>
                          <input autoComplete="off" placeholder="12/28" className={inputClass} />
                        </Field>
                        <Field label="CVC">
                          <input autoComplete="off" placeholder="123" className={inputClass} />
                        </Field>
                      </div>
                    )}
                    <p className="mt-4 text-[13.5px] text-sub">{t("bk.demo")}</p>
                  </section>
                </div>
              ) : null}

              {step === 3 && receiptRoom ? (
                <Receipt
                  code={code}
                  bookingId={bookingId}
                  guestName={name}
                  guestEmail={email}
                  guestPhone={phone}
                  guests={String(guests)}
                  checkIn={new Date(stay.from + "T12:00:00")}
                  checkOut={new Date(stay.to + "T12:00:00")}
                  room={receiptRoom}
                  nights={nights}
                  rate={selected?.rate ?? 0}
                  subtotal={subtotal}
                  deposit={deposit}
                  balance={balance}
                  rateLines={rateLines}
                />
              ) : null}
            </div>

            {step < 3 ? (
              <BookingDock
                room={selected}
                checkIn={stay.from}
                checkOut={stay.to}
                guests={guests}
                nights={nights}
                subtotal={subtotal}
                deposit={deposit}
                balance={balance}
                savings={savings}
                rateLines={rateLines}
                priced={rulesLoaded}
                action={action}
                hint={hint}
              />
            ) : null}
          </div>
        </div>
      </section>

      {pickerOpen ? (
        <StayPicker
          lang={lang}
          open
          anchor={dateBtnRef.current}
          value={draft}
          focus="in"
          today={hotelDayIso()}
          onChange={setDraft}
          onClose={closePicker}
          labels={{
            title: t("cal.title"),
            done: t("cal.done"),
            prev: t("cal.prev"),
            next: t("cal.next"),
            from: t("cal.from"),
            close: t("cal.close"),
            pickIn: t("cal.pickIn"),
            pickOut: t("cal.pickOut"),
          }}
          priceFor={
            rulesLoaded
              ? (iso) => {
                  const pool = selected ? [selected] : rooms;
                  let min: number | null = null;
                  for (const r of pool) {
                    const p = quoteStay(r.rate, iso, nextDay(iso), rulesByRoom[r.id] ?? []).total;
                    if (min == null || p < min) min = p;
                  }
                  return min;
                }
              : undefined
          }
          formatPrice={format}
        />
      ) : null}
    </>
  );
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1, 12)).toISOString().slice(0, 10);
}

const inputClass = "w-full px-4 py-3.5 text-[16px] text-ink";

function Field({
  label,
  children,
  className,
  error,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-[13.5px] text-coral-deep">{error}</span> : null}
    </label>
  );
}
