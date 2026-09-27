"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { format as dfFormat } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AddonPicker } from "@/components/booking/AddonPicker";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { PaymentRails, PromptPayQr, type RailStatus } from "@/components/booking/PaymentRails";
import { PropertyMap, type MapAvailability } from "@/components/booking/PropertyMap";
import { RateBreakdown } from "@/components/booking/RateBreakdown";
import { RoomSelectCard } from "@/components/booking/RoomSelectCard";
import { ListboxField } from "@/components/ui/ListboxField";
import { priceAddons, type AddonLine, type AddonSelection } from "@/lib/addons";
import { generateBookingCode } from "@/lib/bookingUtils";
import { useCurrency } from "@/lib/currency";
import { dfLocale } from "@/lib/dateLocale";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";
import { useGuestAddons, useGuestPriceRulesByRoom, useGuestRooms, useOwner } from "@/lib/ownerStore";
import type { Rail } from "@/lib/payments";
import { groupNights, lowestNightlyRate, nightlyRate, otaEquivalent, quoteStay, type RateLine } from "@/lib/pricing";
import { SHORT_KEY_TO_SLUG, type Room, type RoomShortKey } from "@/lib/rooms";
import { addDays, cn, hotelToday, isoDate, nightsBetween } from "@/lib/utils";

// Heavy / later-step pieces load on demand · keeps the /book initial JS light.
const DateRangePicker = dynamic(
  () => import("@/components/ui/DateRangePicker").then((m) => m.DateRangePicker),
  { ssr: false, loading: () => <DateRangeShell /> }
);
const Receipt = dynamic(() => import("@/components/booking/Receipt").then((m) => m.Receipt), { ssr: false });
const RoomDetailsModal = dynamic(
  () => import("@/components/booking/RoomDetailsModal").then((m) => m.RoomDetailsModal),
  { ssr: false }
);

const TRUST_KEYS = ["trust.1", "trust.2", "trust.3", "trust.4"] as const;

/**
 * v15 · Two steps, not four.
 *
 *   1 · Your stay      dates + guests, the house as a plan, the room, the packages
 *   2 · Confirm & pay  who is coming, how they pay
 *   ✓ · Confirmed      receipt, QR or bank details, the concierge knows the code
 *
 * Every price on the page is the SERVER's quote (calendar rules + demand
 * pricing + packages) fetched as the guest composes the stay; the local
 * estimate only fills the gap while the quote is in flight. The booking
 * request re-prices on the server and the payment rails never see a card.
 */

function DateRangeShell() {
  const { lang } = useI18n();
  const inDate = addDays(hotelToday(), 1);
  const outDate = addDays(hotelToday(), 2);
  const label = `${dfFormat(inDate, "d MMM", dfLocale(lang))} - ${dfFormat(outDate, "d MMM yyyy", dfLocale(lang))}`;
  return (
    <div
      data-date-shell
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left text-base text-ink"
    >
      <svg className="h-5 w-5 shrink-0 text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

type AvailabilityDto = {
  rooms: {
    slug: string;
    available: boolean;
    unitsLeft: number;
    total: number;
    lines: RateLine[];
    mixed: boolean;
    minStay: { minNights: number; label: string } | null;
  }[];
};

type QuoteDto = {
  nights: number;
  stay: { lines: RateLine[]; total: number; mixed: boolean; otaTotal: number; minStay: { minNights: number; label: string } | null };
  addons: AddonLine[];
  addonsTotal: number;
  roomTotal: number;
  total: number;
  depositPct: number;
  deposit: number;
  balance: number;
  savingsVsOta: number;
  available: boolean;
  unitsLeft: number;
  blockedBy: "unavailable" | "min_stay" | "past" | null;
  display: { currency: string; rate: number; rateSource: "live" | "fallback" };
};

type PaymentOutcome =
  | { kind: "promptpay"; payload: string | null; amountThb: number; live: boolean }
  | { kind: "wire"; live: boolean; instructions: { bankName: string; accountName: string; accountNo: string; swift: string; reference: string } }
  | { kind: "demo"; rail: Rail }
  | { kind: "settled" }
  | { kind: "redirecting" };

export default function BookPageClient() {
  const { t, tr, lang } = useI18n();
  const { format, currency, rateSource } = useCurrency();
  const { user, attachBooking } = useGuestAuth();
  const searchParams = useSearchParams();
  const rooms = useGuestRooms();
  const addonCatalogue = useGuestAddons();
  const rulesByRoom = useGuestPriceRulesByRoom();
  const { hydrated: rulesLoaded } = useOwner();
  const stepperRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [checkIn, setCheckIn] = useState<Date>(() => addDays(hotelToday(), 1));
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => addDays(hotelToday(), 2));
  const [guests, setGuests] = useState("2");
  const [roomSlug, setRoomSlug] = useState<string | null>(null);
  const [selection, setSelection] = useState<AddonSelection[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [arrival, setArrival] = useState("");
  const [requests, setRequests] = useState("");
  const [rail, setRail] = useState<Rail>("promptpay");
  const [railStatus, setRailStatus] = useState<RailStatus | null>(null);
  const [code, setCode] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [payment, setPayment] = useState<PaymentOutcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailsRoom, setDetailsRoom] = useState<Room | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; email?: boolean; phone?: boolean }>({});
  const [availability, setAvailability] = useState<AvailabilityDto | null>(null);
  const [quote, setQuote] = useState<QuoteDto | null>(null);
  const [quoting, setQuoting] = useState(false);

  const paidCode = searchParams.get("paid");
  const cancelledCode = searchParams.get("cancelled");

  function findRoomByParam(param: string): Room | undefined {
    return (
      rooms.find((r) => r.slug === param || r.shortKey === param) ??
      rooms.find((r) => r.slug === (SHORT_KEY_TO_SLUG[param as RoomShortKey] ?? param))
    );
  }

  useEffect(() => {
    const inParam = searchParams.get("in");
    const outParam = searchParams.get("out");
    const gParam = searchParams.get("g");
    const roomParam = searchParams.get("room");
    if (inParam) setCheckIn(new Date(inParam + "T12:00:00"));
    if (outParam) setCheckOut(new Date(outParam + "T12:00:00"));
    if (gParam) setGuests(gParam);
    if (roomParam) {
      const room = findRoomByParam(roomParam);
      if (room) setRoomSlug(room.slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rooms]);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  useEffect(() => {
    void fetch("/api/payments")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: RailStatus | null) => s && setRailStatus(s))
      .catch(() => undefined);
  }, []);

  const nights = checkOut && checkOut > checkIn ? nightsBetween(isoDate(checkIn), isoDate(checkOut)) : 0;
  const datesValid = Boolean(checkOut && checkOut > checkIn);
  const inIso = isoDate(checkIn);
  const outIso = checkOut ? isoDate(checkOut) : "";
  const guestCount = Number(guests) || 2;
  const selectedRoom = roomSlug ? rooms.find((r) => r.slug === roomSlug) ?? null : null;

  /* ── Live availability for every room · one call per date change ───────── */
  useEffect(() => {
    if (!datesValid) {
      setAvailability(null);
      return;
    }
    const controller = new AbortController();
    const id = window.setTimeout(() => {
      void fetch(`/api/availability?in=${inIso}&out=${outIso}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: AvailabilityDto | null) => d && setAvailability(d))
        .catch(() => undefined);
    }, 250);
    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
  }, [datesValid, inIso, outIso]);

  /* ── The authoritative quote for the composed stay ──────────────────────── */
  const selectionKey = JSON.stringify(selection);
  useEffect(() => {
    if (!datesValid || !roomSlug) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    setQuoting(true);
    const id = window.setTimeout(() => {
      void fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomSlug, checkIn: inIso, checkOut: outIso, guests: guestCount, addons: selection, currency }),
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((q: QuoteDto | null) => {
          if (q) setQuote(q);
          setQuoting(false);
        })
        .catch(() => setQuoting(false));
    }, 250);
    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datesValid, roomSlug, inIso, outIso, guestCount, selectionKey, currency]);

  /* ── Local estimate while the quote is in flight ────────────────────────── */
  const estimate = useMemo(() => {
    if (!selectedRoom || !checkOut || nights <= 0) return null;
    return quoteStay(selectedRoom.rate, inIso, outIso, rulesByRoom[selectedRoom.id] ?? []);
  }, [selectedRoom, checkOut, nights, inIso, outIso, rulesByRoom]);
  const localAddons = useMemo(
    () => priceAddons(addonCatalogue, selection, nights, guestCount),
    [addonCatalogue, selection, nights, guestCount]
  );

  const rateLines: RateLine[] = quote?.stay.lines ?? (estimate ? groupNights(estimate.nights) : []);
  const roomTotal = quote?.roomTotal ?? estimate?.total ?? 0;
  const addonLines = quote?.addons ?? localAddons.lines;
  const addonsTotal = quote?.addonsTotal ?? localAddons.total;
  const subtotal = roomTotal + addonsTotal;
  const depositPct = quote?.depositPct ?? 30;
  const deposit = quote?.deposit ?? Math.round((subtotal * depositPct) / 100);
  const balance = subtotal - deposit;
  const savings =
    quote?.savingsVsOta ??
    (selectedRoom && estimate ? otaEquivalent(estimate.total, selectedRoom.rate, selectedRoom.ota) - estimate.total : 0);
  const rate = selectedRoom?.rate ?? 0;

  const mapAvailability: MapAvailability | null = useMemo(() => {
    if (!availability) return null;
    const out: MapAvailability = {};
    for (const r of availability.rooms) out[r.slug] = { available: r.available, unitsLeft: r.unitsLeft, total: r.total };
    return out;
  }, [availability]);

  const stayTotalFor = useCallback(
    (room: Room): number | null => {
      const live = availability?.rooms.find((r) => r.slug === room.slug);
      if (live) return live.total;
      if (!rulesLoaded || !checkOut || nights <= 0) return null;
      return quoteStay(room.rate, inIso, outIso, rulesByRoom[room.id] ?? []).total;
    },
    [availability, rulesLoaded, checkOut, nights, inIso, outIso, rulesByRoom]
  );

  const priceForDate = useCallback(
    (dateIso: string): number | null => {
      if (!rulesLoaded) return null;
      if (selectedRoom) return nightlyRate(selectedRoom.rate, dateIso, rulesByRoom[selectedRoom.id] ?? []).price;
      return lowestNightlyRate(rooms, dateIso, rulesByRoom);
    },
    [rulesLoaded, selectedRoom, rooms, rulesByRoom]
  );

  const guestOptions = useMemo(
    () => ["1", "2", "3", "4"].map((n) => ({ value: n, label: t(`g${n}` as "g1") })),
    [t]
  );

  const steps = [t("bk.step1"), t("bk.step2"), t("bk.step3")];
  const selectedAvail = availability?.rooms.find((r) => r.slug === roomSlug);
  const roomBookable = selectedAvail ? selectedAvail.available : true;
  const step1Valid = datesValid && Boolean(roomSlug) && roomBookable && (quote ? quote.available : true);
  const detailsValid = name.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0;

  function scrollToStepper() {
    stepperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function goStep(next: 1 | 2 | 3) {
    setStep(next);
    setSummaryExpanded(false);
    setSubmitError(null);
    requestAnimationFrame(() => scrollToStepper());
  }
  function handleDates(from?: Date, to?: Date) {
    setCheckIn(from ?? addDays(hotelToday(), 1));
    setCheckOut(to);
  }
  function handleSelectRoom(room: Room) {
    setRoomSlug(room.slug);
    requestAnimationFrame(() => {
      document.getElementById(`room-${room.slug}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
  function scrollToFirstError() {
    const errors = { name: !name.trim(), email: !email.trim(), phone: !phone.trim() };
    setFieldErrors(errors);
    const first = errors.name ? nameRef.current : errors.email ? emailRef.current : errors.phone ? phoneRef.current : null;
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleConfirm() {
    if (!selectedRoom || !checkOut) return;
    if (!detailsValid) {
      scrollToFirstError();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const suggestedCode = generateBookingCode();
    const suggestedId = `bk-${Date.now()}`;
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: suggestedId,
          code: suggestedCode,
          guest: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          roomSlug: selectedRoom.slug,
          checkIn: inIso,
          checkOut: outIso,
          adults: guestCount,
          arrivalTime: arrival.trim() || null,
          specialRequests: requests.trim() || null,
          source: "Direct",
          status: "ok",
          addons: selection,
          currency,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitError(
          body.error === "overbooked"
            ? t("bk.err.taken")
            : body.error === "min_stay"
              ? t("bk.err.minStay")
              : body.error === "past"
                ? t("bk.err.past")
                : t("bk.err.generic")
        );
        // Refresh the plan · the room may just have gone.
        setAvailability(null);
        setQuote(null);
        setRoomSlug(null);
        goStep(1);
        return;
      }
      const created = (await res.json()) as { id: string; code: string };
      setBookingId(created.id);
      setCode(created.code);
      if (user) attachBooking(created.id);
      try {
        localStorage.setItem("tkh-stay", created.code);
      } catch {
        /* ignore */
      }

      const pay = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", bookingId: created.id, rail, scope: "deposit", currency }),
      });
      const outcome = (await pay.json().catch(() => null)) as
        | ({ kind: "redirect"; url: string } | PaymentOutcome | { error: string })
        | null;
      if (!outcome || "error" in outcome) {
        setPayment({ kind: "demo", rail });
      } else if (outcome.kind === "redirect") {
        setPayment({ kind: "redirecting" });
        window.location.assign(outcome.url);
        return;
      } else {
        setPayment(outcome);
      }
      goStep(3);
    } catch {
      setSubmitError(t("bk.err.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  const summaryProps = {
    checkIn,
    checkOut,
    guests,
    room: selectedRoom,
    nights,
    rate,
    subtotal: roomTotal,
    savings,
    deposit,
    balance,
    rateLines,
    addonLines,
    addonsTotal,
    note:
      currency !== "THB"
        ? t(rateSource === "live" || quote?.display.rateSource === "live" ? "cur.liveNote" : "cur.indicative", { c: currency })
        : undefined,
  };

  /* ── Returning from a hosted payment page ───────────────────────────────── */
  if (paidCode || cancelledCode) {
    const paid = Boolean(paidCode);
    return (
      <section className="px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-[640px] rounded-[16px] bg-white p-8 shadow-panel">
          <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-blue">{t("nav.book")}</p>
          <h1 className="font-display text-3xl text-ink">{paid ? t("bk.paid.h1") : t("bk.paid.cancelledH1")}</h1>
          <p className="mt-3 text-ink/80">{paid ? t("bk.paid.p") : t("bk.paid.cancelledP")}</p>
          <p className="mt-6 font-display text-2xl tracking-wide text-gold">{paidCode ?? cancelledCode}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">
              {t("bk.back")}
            </Link>
            {!paid ? (
              <Link href="/book" className="btn-secondary">
                {t("bk.paid.tryAgain")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {step < 3 ? (
        <BookingSummary {...summaryProps} mobile expanded={summaryExpanded} onToggle={() => setSummaryExpanded((v) => !v)} />
      ) : null}

      <section className="px-4 pb-16 pt-28 sm:px-6 max-lg:pb-28 print:pt-4">
        <div className="mx-auto max-w-[1180px]">
          <div className={cn("print:hidden", step === 3 && "hidden lg:block")}>
            <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-blue">{t("nav.book")}</p>
            <h1 className="font-display text-4xl text-ink">{t("bk.h1")}</h1>
            <p className="mt-3 max-w-prose text-ink/80">{t("bk.lead")}</p>

            <nav ref={stepperRef} className="my-8 flex scroll-mt-24 flex-wrap gap-2" aria-label={t("a11y.bookingSteps")}>
              {steps.map((label, index) => {
                const n = (index + 1) as 1 | 2 | 3;
                const done = n < step;
                const current = n === step;
                const clickable = n < step && step < 3;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && goStep(n)}
                    className={cn(
                      "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-[0.76rem] font-extrabold tracking-wide transition",
                      current ? "bg-blue text-white" : done ? "bg-sky text-blue hover:bg-sky/80" : "cursor-default bg-cloud text-strike",
                      clickable && "cursor-pointer"
                    )}
                  >
                    {n === 3 ? "✓" : n} · {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="min-w-0 space-y-6">
              {step === 1 ? (
                <div className="tkh-page-fade space-y-6 print:hidden">
                  {/* When */}
                  <div className="rounded-[16px] border border-line bg-white p-6 shadow-panel sm:p-8">
                    <h2 className="mb-6 text-2xl text-ink">{t("bk.when")}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2" data-date-field>
                        <DateRangePicker
                          from={checkIn}
                          to={checkOut}
                          onChange={handleDates}
                          placeholder={t("avail.selectDates")}
                          numberOfMonths={1}
                          priceFor={priceForDate}
                          formatPrice={format}
                        />
                        <p className="mt-2 text-[0.78rem] font-semibold text-sub">{t("bk.helperDates")}</p>
                      </div>
                      <ListboxField label={t("avail.guests")} value={guests} onChange={setGuests} options={guestOptions} />
                    </div>
                    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                      {TRUST_KEYS.map((key) => (
                        <li key={key} className="flex items-center gap-2 text-[0.82rem] font-semibold text-deal before:font-bold before:text-deal before:content-['+']">
                          {t(key)}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm text-ink/70">{t("bk.cancel")}</p>
                  </div>

                  {/* Where */}
                  <div className="rounded-[16px] border border-line bg-white p-6 shadow-panel sm:p-8">
                    <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
                      <h2 className="text-2xl text-ink">{t("bk.where")}</h2>
                      {datesValid ? (
                        <p className="text-[0.85rem] font-semibold text-sub">
                          {inIso} → {outIso} · {t("bk.nightsCount", { n: nights })}
                        </p>
                      ) : null}
                    </div>
                    <p className="mb-5 max-w-prose text-[0.9rem] text-sub">{t("bk.where.p")}</p>
                    <PropertyMap
                      rooms={rooms}
                      selected={roomSlug}
                      availability={mapAvailability}
                      onSelect={handleSelectRoom}
                      formatPrice={format}
                      className="mb-6"
                    />
                    <div className="space-y-4">
                      {rooms.map((room) => {
                        const live = availability?.rooms.find((r) => r.slug === room.slug);
                        const unavailable = live ? !live.available : false;
                        return (
                          <div key={room.id} id={`room-${room.slug}`} className={cn("scroll-mt-24", unavailable && "opacity-60")}>
                            <RoomSelectCard
                              room={room}
                              selected={roomSlug === room.slug}
                              onSelect={() => !unavailable && handleSelectRoom(room)}
                              onViewDetails={() => setDetailsRoom(room)}
                              stayTotal={stayTotalFor(room)}
                              stayNights={nights}
                              unavailable={unavailable}
                              unitsLeft={live?.unitsLeft}
                              minStay={live?.minStay ?? null}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Make it yours */}
                  <div className="rounded-[16px] border border-line bg-white p-6 shadow-panel sm:p-8" data-packages>
                    <h2 className="mb-1 text-2xl text-ink">{t("bk.pkg.h2")}</h2>
                    <p className="mb-5 max-w-prose text-[0.9rem] text-sub">{t("bk.pkg.p")}</p>
                    <AddonPicker
                      addons={addonCatalogue}
                      selection={selection}
                      onChange={setSelection}
                      nights={nights}
                      guests={guestCount}
                      formatPrice={format}
                    />
                    {addonCatalogue.length === 0 ? (
                      <p className="text-[0.85rem] font-semibold text-sub">{t("bk.pkg.loading")}</p>
                    ) : null}
                  </div>

                  {submitError ? (
                    <div role="alert" className="rounded-xl border border-coral-deep/30 bg-coral-bg px-5 py-4 text-sm font-bold text-coral-deep">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="max-lg:hidden">
                    <button
                      type="button"
                      disabled={!step1Valid}
                      onClick={() => goStep(2)}
                      className="rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
                      data-continue
                    >
                      {t("bk.continue")} →
                    </button>
                    {roomSlug && !roomBookable ? (
                      <p className="mt-3 text-[0.82rem] font-bold text-coral-deep">{t("bk.err.taken")}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 2 && selectedRoom && checkOut ? (
                <div className="tkh-page-fade rounded-[16px] border border-line bg-white p-6 shadow-panel sm:p-8 print:hidden">
                  <StepBack onClick={() => goStep(1)} label={t("bk.backStep")} />
                  <h2 className="mb-5 text-2xl text-ink">{t("bk.secure")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("bk.name")}>
                      <input
                        ref={nameRef}
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setFieldErrors((f) => ({ ...f, name: false }));
                        }}
                        placeholder={t("bk.nameph")}
                        autoComplete="name"
                        className={cn(inputClass, fieldErrors.name && "border-coral-deep")}
                      />
                    </Field>
                    <Field label={t("bk.mail")}>
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFieldErrors((f) => ({ ...f, email: false }));
                        }}
                        placeholder="you@email.com"
                        autoComplete="email"
                        className={cn(inputClass, fieldErrors.email && "border-coral-deep")}
                      />
                    </Field>
                    <Field label={t("bk.phone")}>
                      <input
                        ref={phoneRef}
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setFieldErrors((f) => ({ ...f, phone: false }));
                        }}
                        placeholder="+66 8x xxx xxxx"
                        autoComplete="tel"
                        className={cn(inputClass, fieldErrors.phone && "border-coral-deep")}
                      />
                    </Field>
                    <Field label={t("bk.arrival")}>
                      <input value={arrival} onChange={(e) => setArrival(e.target.value)} placeholder="18:30" className={inputClass} />
                    </Field>
                    <Field label={t("bk.requests")} className="sm:col-span-2">
                      <textarea
                        value={requests}
                        onChange={(e) => setRequests(e.target.value)}
                        rows={2}
                        placeholder={t("bk.requestsph")}
                        className={cn(inputClass, "min-h-[72px] resize-y")}
                      />
                    </Field>
                  </div>

                  {rateLines.length > 0 ? (
                    <div className="mt-6 rounded-xl border border-line bg-cloud/50 px-5 py-4">
                      <h3 className="mb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">{t("bk.perNight")}</h3>
                      <RateBreakdown lines={rateLines} className="text-sm" />
                      {addonLines.length > 0 ? (
                        <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                          {addonLines.map((l) => (
                            <li key={l.key} className="flex justify-between gap-3">
                              <span className="text-sub">
                                {tr(l.name)}
                                {l.unit === "stay" && l.qty > 1 ? ` × ${l.qty}` : l.unit !== "stay" ? ` × ${l.factor}` : ""}
                              </span>
                              <span className="font-semibold text-ink">{format(l.total)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="mt-3 flex justify-between border-t border-line pt-3 text-base font-bold text-ink">
                        <span>{t("bk.stayTotal")}</span>
                        <span>{format(subtotal)}</span>
                      </div>
                      {quote?.stay.mixed ? <p className="mt-2 text-[0.78rem] font-semibold text-sub">{t("bk.mixedNote")}</p> : null}
                    </div>
                  ) : null}

                  {savings > 0 ? (
                    <div className="my-5 rounded-xl bg-deal-bg px-5 py-4 text-sm font-bold text-deal">
                      {t("bk.save")}: -{format(savings)}
                    </div>
                  ) : null}

                  <h3 className="mb-3 mt-6 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">{t("bk.pay.how")}</h3>
                  <PaymentRails value={rail} onChange={setRail} status={railStatus} />
                  <p className="mt-3 text-[0.78rem] font-semibold text-sub">{t(`bk.rail.${rail}.note`)}</p>
                  <p className="mt-1 text-[0.74rem] font-semibold text-sub">{t("bk.pay.pci")}</p>

                  {submitError ? (
                    <div role="alert" className="mt-5 rounded-xl border border-coral-deep/30 bg-coral-bg px-5 py-4 text-sm font-bold text-coral-deep">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="mt-6 max-lg:hidden">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={submitting || quoting}
                      className="rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark disabled:opacity-60"
                      data-confirm
                    >
                      {submitting ? t("bk.confirming") : `${t("bk.pay")} ${format(deposit)}`}
                    </button>
                  </div>
                  <p className="mt-3.5 text-[0.72rem] font-semibold text-sub">{t("bk.demo")}</p>
                </div>
              ) : null}

              {step === 3 && selectedRoom && checkOut ? (
                <div className="tkh-page-fade space-y-5">
                  {payment ? <PaymentPanel payment={payment} code={code} deposit={deposit} format={format} /> : null}
                  <Receipt
                    code={code}
                    bookingId={bookingId}
                    guestName={name}
                    guestEmail={email}
                    guestPhone={phone}
                    guests={guests}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    room={selectedRoom}
                    nights={nights}
                    rate={rate}
                    subtotal={subtotal}
                    deposit={deposit}
                    balance={balance}
                    rateLines={rateLines}
                    addonLines={addonLines}
                    paymentLabel={payment ? t(paymentLabelKey(payment)) : undefined}
                  />
                </div>
              ) : null}
            </div>

            {step < 3 ? <BookingSummary {...summaryProps} className="print:hidden" /> : null}
          </div>
        </div>
      </section>

      {step < 3 ? (
        <div
          className="z-sticky fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden print:hidden"
          data-booking-action-bar
        >
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
            <div className="min-w-0">
              {selectedRoom && nights > 0 ? (
                <>
                  <div className="truncate font-display text-lg font-bold leading-tight text-ink">{format(subtotal)}</div>
                  <div className="text-[0.72rem] font-semibold text-sub">
                    {t("bk.dep")} {format(deposit)}
                  </div>
                </>
              ) : (
                <div className="text-[0.85rem] font-semibold text-sub">
                  {datesValid ? t("bk.nightsCount", { n: nights }) : t("avail.selectDates")}
                </div>
              )}
            </div>
            {step === 1 ? (
              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => goStep(2)}
                className="inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("bk.continue")} →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-dark disabled:opacity-60"
              >
                {submitting ? t("bk.confirming") : `${t("bk.pay")} ${format(deposit)}`}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {detailsRoom ? <RoomDetailsModal room={detailsRoom} open={Boolean(detailsRoom)} onClose={() => setDetailsRoom(null)} /> : null}
    </>
  );
}

function paymentLabelKey(p: PaymentOutcome): string {
  if (p.kind === "promptpay") return p.live ? "bk.pay.status.awaitScan" : "bk.pay.status.demoPaid";
  if (p.kind === "wire") return p.live ? "bk.pay.status.awaitWire" : "bk.pay.status.demoPaid";
  if (p.kind === "settled") return "bk.pay.status.paid";
  return "bk.pay.status.demoPaid";
}

function PaymentPanel({
  payment,
  code,
  deposit,
  format,
}: {
  payment: PaymentOutcome;
  code: string;
  deposit: number;
  format: (thb: number) => string;
}) {
  const { t } = useI18n();
  if (payment.kind === "promptpay" && payment.payload) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[16px] border border-line bg-white p-6 text-center shadow-panel sm:flex-row sm:text-left" data-payment-panel="promptpay">
        <PromptPayQr payload={payment.payload} />
        <div>
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">{t("bk.rail.promptpay")}</p>
          <p className="mt-1 font-display text-2xl text-ink">{format(payment.amountThb)}</p>
          <p className="mt-2 text-sm text-ink/80">{t("bk.pay.scanLive")}</p>
          <p className="mt-2 text-[0.78rem] font-semibold text-sub">
            {t("bk.pay.reference")}: {code}
          </p>
        </div>
      </div>
    );
  }
  if (payment.kind === "wire" && payment.live) {
    const i = payment.instructions;
    return (
      <div className="rounded-[16px] border border-line bg-white p-6 shadow-panel" data-payment-panel="wire">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">{t("bk.rail.wire")}</p>
        <p className="mt-1 font-display text-2xl text-ink">{format(deposit)}</p>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row k={t("bk.wire.bank")} v={i.bankName} />
          <Row k={t("bk.wire.account")} v={i.accountName} />
          <Row k={t("bk.wire.number")} v={i.accountNo} />
          <Row k="SWIFT" v={i.swift} />
          <Row k={t("bk.pay.reference")} v={i.reference} />
        </dl>
        <p className="mt-4 text-[0.82rem] font-semibold text-sub">{t("bk.wire.note")}</p>
      </div>
    );
  }
  return (
    <div className="rounded-[16px] border border-deal/30 bg-deal-bg px-6 py-5 text-sm font-bold text-deal" data-payment-panel="demo">
      {payment.kind === "settled" ? t("bk.pay.status.paid") : t("bk.pay.demoDone")}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-sub">{k}</dt>
      <dd className="font-semibold text-ink">{v || "—"}</dd>
    </>
  );
}

const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-line bg-white px-4 py-3 text-sm font-semibold text-ink placeholder:text-[#93A0B4] focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">{label}</span>
      {children}
    </label>
  );
}

function StepBack({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="mb-6 inline-flex text-sm font-bold text-blue hover:text-blue-dark">
      {label}
    </button>
  );
}
