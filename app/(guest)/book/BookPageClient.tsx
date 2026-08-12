"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
// Same formatter the hydrated picker uses · the shell must not word its dates
// differently from the control that replaces it.
import { format as dfFormat } from "date-fns";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { RoomSelectCard } from "@/components/booking/RoomSelectCard";

// Heavy / later-step pieces load on demand · keeps the /book initial JS light.
// The loading state is a fully styled, readable date shell (not a blank
// skeleton) · it renders in SSR and with JS disabled, showing the default
// stay dates so the control is always present and legible. The interactive
// react-day-picker calendar swaps in on hydration · behaviour only, no content.
const DateRangePicker = dynamic(
  () => import("@/components/ui/DateRangePicker").then((m) => m.DateRangePicker),
  {
    ssr: false,
    loading: () => <DateRangeShell />,
  }
);
const Receipt = dynamic(
  () => import("@/components/booking/Receipt").then((m) => m.Receipt),
  { ssr: false }
);
const RoomDetailsModal = dynamic(
  () => import("@/components/booking/RoomDetailsModal").then((m) => m.RoomDetailsModal),
  { ssr: false }
);
import { ListboxField } from "@/components/ui/ListboxField";
import { RateBreakdown } from "@/components/booking/RateBreakdown";
import { generateBookingCode, qrMockSvg } from "@/lib/bookingUtils";
import { useCurrency } from "@/lib/currency";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";
import {
  useGuestPriceRulesByRoom,
  useGuestRooms,
  useOwner,
} from "@/lib/ownerStore";
import {
  groupNights,
  lowestNightlyRate,
  nightlyRate,
  otaEquivalent,
  quoteStay,
} from "@/lib/pricing";
import { SHORT_KEY_TO_SLUG, type Room, type RoomShortKey } from "@/lib/rooms";
import {
  addDays,
  hotelToday,
  isoDate,
  nightsBetween,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type PayMethod = "promptpay" | "card";

const TRUST_KEYS = ["trust.1", "trust.2", "trust.3", "trust.4"] as const;

/**
 * The DateRangePicker's loading / SSR state.
 *
 * It is the picker's own trigger, rendered as static markup: same box, same
 * icon, same label, same default stay dates, formatted exactly the way the
 * hydrated control formats them. So the shell and the hydrated picker read
 * identically and occupy identical space · nothing moves and nothing changes
 * wording when react-day-picker arrives.
 *
 * It used to render two labelled fields over a mock month grid. That was 560px
 * of placeholder collapsing to an 80px control on hydration, and its labels
 * were hard-coded English, which a Thai guest with JS off would have seen.
 */
function DateRangeShell() {
  // Hotel time on both sides · see hotelToday(). Rendering the server's day
  // here and the browser's day after hydration made this label jump a day for
  // a Bangkok guest between midnight and 07:00.
  const inDate = addDays(hotelToday(), 1);
  const outDate = addDays(hotelToday(), 2);
  const label = `${dfFormat(inDate, "d MMM")} - ${dfFormat(outDate, "d MMM yyyy")}`;

  return (
    <div
      data-date-shell
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left text-base text-ink"
    >
      <svg
        className="h-5 w-5 shrink-0 text-blue"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

export default function BookPageClient() {
  const { t } = useI18n();
  const { format } = useCurrency();
  const { user, attachBooking } = useGuestAuth();
  const searchParams = useSearchParams();
  const rooms = useGuestRooms();
  const rulesByRoom = useGuestPriceRulesByRoom();
  const { addBooking, hydrated: rulesLoaded } = useOwner();
  const stepperRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>(() => addDays(hotelToday(), 1));
  const [checkOut, setCheckOut] = useState<Date | undefined>(() =>
    addDays(hotelToday(), 2)
  );
  const [guests, setGuests] = useState("2");
  // Keyed by slug, not shortKey · several seeded rooms share a shortKey, so a
  // shortKey lookup can resolve to a different room than the guest picked and
  // price the stay off the wrong rate and rate rules.
  const [roomSlug, setRoomSlug] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("promptpay");
  const [code, setCode] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [detailsRoom, setDetailsRoom] = useState<Room | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: boolean;
    email?: boolean;
    phone?: boolean;
  }>({});

  function findRoomByParam(param: string): Room | undefined {
    return (
      rooms.find((r) => r.slug === param || r.shortKey === param) ??
      rooms.find(
        (r) => r.slug === (SHORT_KEY_TO_SLUG[param as RoomShortKey] ?? param)
      )
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
      if (room) {
        setRoomSlug(room.slug);
        setStep(2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rooms]);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  const nights =
    checkOut && checkOut > checkIn
      ? nightsBetween(isoDate(checkIn), isoDate(checkOut))
      : 0;
  const selectedRoom = roomSlug
    ? rooms.find((r) => r.slug === roomSlug) ?? null
    : null;

  // A stay is the SUM OF NIGHTLY RATES · never rate × nights. Seasons and
  // date overrides can make any two nights of the same stay cost differently.
  const quote = useMemo(() => {
    if (!selectedRoom || !checkOut || nights <= 0) return null;
    return quoteStay(
      selectedRoom.rate,
      isoDate(checkIn),
      isoDate(checkOut),
      rulesByRoom[selectedRoom.id] ?? []
    );
  }, [selectedRoom, checkIn, checkOut, nights, rulesByRoom]);

  const rateLines = useMemo(
    () => (quote ? groupNights(quote.nights) : []),
    [quote]
  );

  const rate = selectedRoom?.rate ?? 0;
  const subtotal = quote?.total ?? 0;
  const savings =
    selectedRoom && quote
      ? otaEquivalent(quote.total, selectedRoom.rate, selectedRoom.ota) -
        quote.total
      : 0;
  const deposit = Math.round(subtotal * 0.3);
  const balance = subtotal - deposit;

  /**
   * Day prices on the calendar · the selected room once one is chosen, the
   * cheapest room otherwise. Null until the rate rules load, so the calendar
   * never shows a price it has to correct.
   */
  /** Stay total for any room on the chosen dates · powers the step 2 cards. */
  const stayTotalFor = useCallback(
    (room: Room): number | null => {
      if (!rulesLoaded || !checkOut || nights <= 0) return null;
      return quoteStay(
        room.rate,
        isoDate(checkIn),
        isoDate(checkOut),
        rulesByRoom[room.id] ?? []
      ).total;
    },
    [rulesLoaded, checkIn, checkOut, nights, rulesByRoom]
  );

  const priceForDate = useCallback(
    (dateIso: string): number | null => {
      if (!rulesLoaded) return null;
      if (selectedRoom) {
        return nightlyRate(
          selectedRoom.rate,
          dateIso,
          rulesByRoom[selectedRoom.id] ?? []
        ).price;
      }
      return lowestNightlyRate(rooms, dateIso, rulesByRoom);
    },
    [rulesLoaded, selectedRoom, rooms, rulesByRoom]
  );

  const guestOptions = useMemo(
    () =>
      ["1", "2", "3", "4"].map((n) => ({
        value: n,
        label: t(`g${n}` as "g1"),
      })),
    [t]
  );

  const steps = [t("bk.s1"), t("bk.s2"), t("bk.s3"), t("bk.s4")];

  const datesValid = Boolean(checkOut && checkOut > checkIn);
  const step1Valid = datesValid;
  const step2Valid = step1Valid && Boolean(roomSlug);
  const step3Valid =
    step2Valid && name.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0;

  function scrollToStepper() {
    stepperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goStep(next: number) {
    setStep(next);
    setSummaryExpanded(false);
    requestAnimationFrame(() => scrollToStepper());
  }

  function handleDates(from?: Date, to?: Date) {
    setCheckIn(from ?? addDays(hotelToday(), 1));
    setCheckOut(to);
  }

  function handleStepClick(target: number) {
    if (target <= step) goStep(target);
  }

  function scrollToFirstError() {
    const errors = {
      name: name.trim().length === 0,
      email: email.trim().length === 0,
      phone: phone.trim().length === 0,
    };
    setFieldErrors(errors);
    const first = errors.name
      ? nameRef.current
      : errors.email
        ? emailRef.current
        : errors.phone
          ? phoneRef.current
          : null;
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handlePayDeposit() {
    if (!selectedRoom || !checkOut) return;
    if (!step3Valid) {
      scrollToFirstError();
      return;
    }

    const bookingCode = generateBookingCode();
    const id = `bk-${Date.now()}`;
    addBooking({
      id,
      code: bookingCode,
      guest: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      roomSlug: selectedRoom.slug,
      checkIn: isoDate(checkIn),
      checkOut: isoDate(checkOut),
      source: "Direct",
      amount: subtotal,
      status: "ok",
      notes: "",
    });
    if (user) attachBooking(id);
    setBookingId(id);
    setCode(bookingCode);
    goStep(4);
  }

  const summaryProps = {
    checkIn,
    checkOut,
    guests,
    room: selectedRoom,
    nights,
    rate,
    subtotal,
    savings,
    deposit,
    balance,
    rateLines,
  };

  function handleSelectRoom(room: Room) {
    setRoomSlug(room.slug);
    requestAnimationFrame(() => {
      document
        .getElementById(`room-${room.slug}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <>
      {step < 4 ? (
        <BookingSummary
          {...summaryProps}
          mobile
          expanded={summaryExpanded}
          onToggle={() => setSummaryExpanded((v) => !v)}
        />
      ) : null}

      <section className="px-4 pb-16 pt-28 sm:px-6 max-lg:pb-28 print:pt-4">
        <div className="mx-auto max-w-[1180px]">
          <div className={cn("print:hidden", step === 4 && "hidden lg:block")}>
            <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-blue">
              {t("nav.book")}
            </p>
            <h1 className="font-display text-4xl text-ink">{t("bk.h1")}</h1>
            <p className="mt-3 max-w-prose text-ink/80">{t("bk.lead")}</p>

            <nav
              ref={stepperRef}
              className="my-8 flex scroll-mt-24 flex-wrap gap-2"
              aria-label="Booking steps"
            >
              {steps.map((label, index) => {
                const n = index + 1;
                const done = n < step;
                const current = n === step;
                const clickable = n <= step;

                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!clickable}
                    onClick={() => handleStepClick(n)}
                    className={cn(
                      "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-[0.76rem] font-extrabold tracking-wide transition",
                      current
                        ? "bg-blue text-white"
                        : done
                          ? "bg-sky text-blue hover:bg-sky/80"
                          : "cursor-default bg-cloud text-strike",
                      clickable && !current && "cursor-pointer"
                    )}
                  >
                    {n} · {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="min-w-0">
              {step === 1 ? (
                <div className="rounded-[14px] bg-white p-6 shadow-panel sm:p-9 print:hidden">
                  <StepBack
                    disabled
                    label={t("bk.backStep")}
                    homeHref="/"
                  />
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
                      <p className="mt-2 text-[0.78rem] font-semibold text-sub">
                        {t("bk.helperDates")}
                      </p>
                    </div>
                    <ListboxField
                      label={t("avail.guests")}
                      value={guests}
                      onChange={setGuests}
                      options={guestOptions}
                    />
                  </div>

                  <ul className="my-6 grid gap-2 sm:grid-cols-2">
                    {TRUST_KEYS.map((key) => (
                      <li
                        key={key}
                        className="flex items-center gap-2 text-[0.82rem] font-semibold text-deal before:font-bold before:text-deal before:content-['+']"
                      >
                        {t(key)}
                      </li>
                    ))}
                  </ul>

                  <p className="mb-5 text-[0.82rem] font-semibold text-sub">
                    {t("bk.cancel")}
                  </p>
                  <button
                    type="button"
                    disabled={!step1Valid}
                    onClick={() => goStep(2)}
                    className="rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-40 max-lg:hidden"
                  >
                    {t("bk.seeRooms")} →
                  </button>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="rounded-[14px] bg-white p-6 shadow-panel sm:p-9 print:hidden">
                  <StepBack onClick={() => goStep(1)} label={t("bk.backStep")} />
                  <h2 className="mb-1 text-2xl text-ink">{t("bk.choose")}</h2>
                  {datesValid ? (
                    <p className="mb-5 text-[0.85rem] font-semibold text-sub">
                      {isoDate(checkIn)} → {isoDate(checkOut!)} ·{" "}
                      {t("bk.nightsCount", { n: nights })}
                    </p>
                  ) : null}
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <div key={room.id} id={`room-${room.slug}`} className="scroll-mt-24">
                        <RoomSelectCard
                          room={room}
                          selected={roomSlug === room.slug}
                          onSelect={() => handleSelectRoom(room)}
                          onViewDetails={() => setDetailsRoom(room)}
                          stayTotal={stayTotalFor(room)}
                          stayNights={nights}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 max-lg:hidden">
                    <button
                      type="button"
                      disabled={!step2Valid}
                      onClick={() => goStep(3)}
                      className="rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("bk.continue")} →
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 3 && selectedRoom && checkOut ? (
                <div className="rounded-[14px] bg-white p-6 shadow-panel sm:p-9 print:hidden">
                  <StepBack onClick={() => goStep(2)} label={t("bk.backStep")} />
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
                        className={cn(inputClass, fieldErrors.email && "border-coral-deep")}
                      />
                    </Field>
                    <Field label={t("bk.phone")} className="sm:col-span-2 sm:max-w-sm">
                      <input
                        ref={phoneRef}
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setFieldErrors((f) => ({ ...f, phone: false }));
                        }}
                        placeholder="+66 8x xxx xxxx"
                        className={cn(inputClass, fieldErrors.phone && "border-coral-deep")}
                      />
                    </Field>
                  </div>

                  {rateLines.length > 0 ? (
                    <div className="mt-6 rounded-xl border border-line bg-cloud/50 px-5 py-4">
                      <h3 className="mb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
                        {t("bk.perNight")}
                      </h3>
                      <RateBreakdown lines={rateLines} className="text-sm" />
                      <div className="mt-3 flex justify-between border-t border-line pt-3 text-base font-bold text-ink">
                        <span>{t("bk.stayTotal")}</span>
                        <span>{format(subtotal)}</span>
                      </div>
                      {quote?.mixed ? (
                        <p className="mt-2 text-[0.78rem] font-semibold text-sub">
                          {t("bk.mixedNote")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {savings > 0 ? (
                    <div className="my-5 rounded-xl bg-deal-bg px-5 py-4 text-sm font-bold text-deal">
                      {t("bk.save")}: -{format(savings)}
                    </div>
                  ) : null}

                  <div className="mb-4 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPayMethod("promptpay")}
                      className={cn(
                        "flex-1 rounded-[10px] border-2 py-3 text-sm font-extrabold",
                        payMethod === "promptpay"
                          ? "border-blue bg-sky/40 text-blue"
                          : "border-line text-ink"
                      )}
                    >
                      PromptPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod("card")}
                      className={cn(
                        "flex-1 rounded-[10px] border-2 py-3 text-sm font-extrabold",
                        payMethod === "card"
                          ? "border-blue bg-sky/40 text-blue"
                          : "border-line text-ink"
                      )}
                    >
                      {t("bk.card")}
                    </button>
                  </div>

                  {payMethod === "promptpay" ? (
                    <div className="grid place-items-center rounded-xl bg-cloud p-6">
                      <svg
                        width="150"
                        height="150"
                        viewBox="0 0 21 21"
                        shapeRendering="crispEdges"
                        aria-hidden
                        dangerouslySetInnerHTML={{ __html: qrMockSvg() }}
                      />
                      <p className="mt-3 text-[0.78rem] font-bold text-sub">
                        {t("bk.scan")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t("bk.cardNum")} className="sm:col-span-2">
                        <input
                          inputMode="numeric"
                          placeholder="4242 4242 4242 4242"
                          className={inputClass}
                        />
                      </Field>
                      <Field label={t("bk.expiry")}>
                        <input placeholder="12/28" className={inputClass} />
                      </Field>
                      <Field label="CVC">
                        <input placeholder="123" className={inputClass} />
                      </Field>
                    </div>
                  )}

                  <div className="mt-5 max-lg:hidden">
                    <button
                      type="button"
                      onClick={handlePayDeposit}
                      className="rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark"
                    >
                      {t("bk.pay")} {format(deposit)}
                    </button>
                  </div>
                  <p className="mt-3.5 text-[0.72rem] font-semibold text-sub">
                    {t("bk.demo")}
                  </p>
                </div>
              ) : null}

              {step === 4 && selectedRoom && checkOut ? (
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
                />
              ) : null}
            </div>

            {step < 4 ? (
              <BookingSummary {...summaryProps} className="print:hidden" />
            ) : null}
          </div>
        </div>
      </section>

      {/* Mobile sticky action bar · a visible next action at every step */}
      {step < 4 ? (
        <div
          className="z-sticky fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden print:hidden"
          data-booking-action-bar
        >
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
            <div className="min-w-0">
              {selectedRoom && nights > 0 ? (
                <>
                  <div className="truncate font-display text-lg font-bold leading-tight text-ink">
                    {format(subtotal)}
                  </div>
                  <div className="text-[0.72rem] font-semibold text-sub">
                    {t("bk.dep")} {format(deposit)}
                  </div>
                </>
              ) : (
                <div className="text-[0.85rem] font-semibold text-sub">
                  {datesValid
                    ? t("bk.nightsCount", { n: nights })
                    : t("avail.selectDates")}
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
                {t("bk.seeRooms")} →
              </button>
            ) : step === 2 ? (
              <button
                type="button"
                disabled={!step2Valid}
                onClick={() => goStep(3)}
                className="inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("bk.continue")} →
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePayDeposit}
                className="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-dark"
              >
                {t("bk.pay")} {format(deposit)}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {detailsRoom ? (
        <RoomDetailsModal
          room={detailsRoom}
          open={Boolean(detailsRoom)}
          onClose={() => setDetailsRoom(null)}
        />
      ) : null}
    </>
  );
}

const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-line bg-white px-4 py-3 text-sm font-semibold text-ink placeholder:text-[#93A0B4] focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
        {label}
      </span>
      {children}
    </label>
  );
}

function StepBack({
  onClick,
  label,
  disabled,
  homeHref,
}: {
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  homeHref?: string;
}) {
  if (disabled && homeHref) {
    return (
      <Link
        href={homeHref}
        className="mb-4 inline-flex min-h-[44px] items-center text-sm font-bold text-blue hover:text-blue-dark"
      >
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mb-6 inline-flex text-sm font-bold text-blue hover:text-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}
