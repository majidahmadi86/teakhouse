"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Receipt } from "@/components/booking/Receipt";
import { RoomDetailsModal } from "@/components/booking/RoomDetailsModal";
import { RoomSelectCard } from "@/components/booking/RoomSelectCard";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ListboxField } from "@/components/ui/ListboxField";
import { generateBookingCode, qrMockSvg } from "@/lib/bookingUtils";
import { useI18n } from "@/lib/i18n";
import { useGuestRooms, useOwner } from "@/lib/ownerStore";
import { getRoomByKey, type Room, type RoomShortKey } from "@/lib/rooms";
import {
  addDays,
  formatBaht,
  isoDate,
  nightsBetween,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type PayMethod = "promptpay" | "card";

const TRUST_KEYS = ["trust.1", "trust.2", "trust.3", "trust.4"] as const;

export default function BookPageClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const rooms = useGuestRooms();
  const { addBooking } = useOwner();

  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>(() => addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date | undefined>(() =>
    addDays(new Date(), 2)
  );
  const [guests, setGuests] = useState("2");
  const [roomKey, setRoomKey] = useState<RoomShortKey | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("promptpay");
  const [code, setCode] = useState("");
  const [detailsRoom, setDetailsRoom] = useState<Room | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  useEffect(() => {
    const inParam = searchParams.get("in");
    const outParam = searchParams.get("out");
    const gParam = searchParams.get("g");
    const roomParam = searchParams.get("room");

    if (inParam) setCheckIn(new Date(inParam + "T12:00:00"));
    if (outParam) setCheckOut(new Date(outParam + "T12:00:00"));
    if (gParam) setGuests(gParam);

    if (roomParam) {
      const room = getRoomByKey(roomParam);
      if (room) {
        setRoomKey(room.shortKey);
        setStep(2);
      }
    }
  }, [searchParams]);

  const nights =
    checkOut && checkOut > checkIn
      ? nightsBetween(isoDate(checkIn), isoDate(checkOut))
      : 0;
  const selectedRoom = roomKey ? getRoomByKey(roomKey) ?? null : null;
  const rate = selectedRoom?.rate ?? 0;
  const subtotal = selectedRoom && nights > 0 ? selectedRoom.rate * nights : 0;
  const savings =
    selectedRoom && nights > 0
      ? (selectedRoom.ota - selectedRoom.rate) * nights
      : 0;
  const deposit = Math.round(subtotal * 0.3);
  const balance = subtotal - deposit;

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
  const step2Valid = step1Valid && Boolean(roomKey);
  const step3Valid =
    step2Valid && name.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0;

  function goStep(next: number) {
    setStep(next);
    setSummaryExpanded(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDates(from?: Date, to?: Date) {
    if (from) setCheckIn(from);
    if (to) {
      setCheckOut(to);
    } else if (from) {
      setCheckOut(undefined);
    }
  }

  function handleStepClick(target: number) {
    if (target <= step) goStep(target);
  }

  function handlePayDeposit() {
    if (!selectedRoom || !checkOut || !step3Valid) return;

    const bookingCode = generateBookingCode();
    addBooking({
      id: `bk-${Date.now()}`,
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
  };

  return (
    <>
      <BookingSummary
        {...summaryProps}
        mobile
        expanded={summaryExpanded}
        onToggle={() => setSummaryExpanded((v) => !v)}
      />

      <section className="px-4 pb-16 pt-28 sm:px-6 print:pt-4">
        <div className="mx-auto max-w-[1180px]">
          <div className={cn("print:hidden", step === 4 && "hidden lg:block")}>
            <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-amber">
              {t("nav.book")}
            </p>
            <h1 className="font-display text-4xl text-ink">{t("bk.h1")}</h1>
            <p className="mt-3 max-w-prose text-ink/80">{t("bk.lead")}</p>

            <nav
              className="my-8 flex flex-wrap gap-2"
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
                      "rounded-full px-4 py-2 text-[0.76rem] font-extrabold tracking-wide transition",
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
                    <div className="sm:col-span-2">
                      <DateRangePicker
                        from={checkIn}
                        to={checkOut}
                        onChange={handleDates}
                        placeholder={t("avail.selectDates")}
                        numberOfMonths={1}
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
                    className="rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
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
                      <RoomSelectCard
                        key={room.id}
                        room={room}
                        selected={roomKey === room.shortKey}
                        onSelect={() => setRoomKey(room.shortKey)}
                        onViewDetails={() => setDetailsRoom(room)}
                      />
                    ))}
                  </div>
                  <div className="mt-6">
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("bk.nameph")}
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t("bk.mail")}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t("bk.phone")} className="sm:col-span-2 sm:max-w-sm">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+66 8x xxx xxxx"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  {savings > 0 ? (
                    <div className="my-5 rounded-xl bg-deal-bg px-5 py-4 text-sm font-bold text-deal">
                      {t("bk.save")}: -{formatBaht(savings)}
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

                  <div className="mt-5">
                    <button
                      type="button"
                      disabled={!step3Valid}
                      onClick={handlePayDeposit}
                      className="rounded-full bg-amber px-7 py-3.5 text-sm font-bold text-navy hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("bk.pay")} {formatBaht(deposit)}
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
                />
              ) : null}
            </div>

            {step < 4 ? (
              <BookingSummary {...summaryProps} className="print:hidden" />
            ) : null}
          </div>
        </div>
      </section>

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
      <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-amber">
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
        className="mb-6 inline-flex text-sm font-bold text-blue hover:text-blue-dark"
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
