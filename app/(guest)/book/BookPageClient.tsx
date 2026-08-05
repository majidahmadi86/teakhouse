"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ListboxField } from "@/components/ui/ListboxField";
import { SafeImage } from "@/components/SafeImage";
import { generateBookingCode, qrMockSvg } from "@/lib/bookingUtils";
import { useI18n } from "@/lib/i18n";
import { getRoomByKey, type RoomShortKey } from "@/lib/rooms";
import { useGuestRooms } from "@/lib/ownerStore";
import {
  addDays,
  formatBaht,
  isoDate,
  nightsBetween,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type PayMethod = "promptpay" | "card";

export default function BookPageClient() {
  const { t, tr } = useI18n();
  const searchParams = useSearchParams();
  const rooms = useGuestRooms();

  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>(() => addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(() => addDays(new Date(), 2));
  const [guests, setGuests] = useState("2");
  const [roomKey, setRoomKey] = useState<RoomShortKey | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("promptpay");
  const [code, setCode] = useState("");

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

  const nights = nightsBetween(isoDate(checkIn), isoDate(checkOut));
  const selectedRoom = roomKey ? getRoomByKey(roomKey) : null;
  const total = selectedRoom ? selectedRoom.rate * nights : 0;
  const deposit = Math.round(total * 0.3);
  const save = selectedRoom ? (selectedRoom.ota - selectedRoom.rate) * nights : 0;

  const guestOptions = useMemo(
    () =>
      ["1", "2", "3", "4"].map((n) => ({
        value: n,
        label: t(`g${n}` as "g1"),
      })),
    [t]
  );

  const steps = [t("bk.s1"), t("bk.s2"), t("bk.s3"), t("bk.s4")];

  function goStep(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="px-6 pb-16 pt-28">
      <div className="mx-auto max-w-[760px]">
        <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
          {t("nav.book")}
        </p>
        <h1 className="text-4xl">{t("bk.h1")}</h1>
        <p className="mt-3 max-w-prose text-ink/80">{t("bk.lead")}</p>

        <div className="my-10 flex flex-wrap gap-2">
          {steps.map((label, index) => {
            const n = index + 1;
            return (
              <span
                key={label}
                className={cn(
                  "rounded-full px-4 py-2 text-[0.76rem] font-extrabold tracking-wide",
                  step === n
                    ? "bg-brand text-white"
                    : n < step
                      ? "bg-line text-brand"
                      : "bg-brand/10 text-strike"
                )}
              >
                {n} · {label}
              </span>
            );
          })}
        </div>

        {step === 1 ? (
          <div className="rounded-[14px] bg-white p-9 shadow-panel">
            <h2 className="mb-6 text-2xl">{t("bk.when")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DateRangePicker
                  from={checkIn}
                  to={checkOut}
                  onChange={(from, to) => {
                    if (from) setCheckIn(from);
                    if (to) setCheckOut(to);
                    if (from && !to) setCheckOut(addDays(from, 1));
                  }}
                  placeholder={t("avail.selectDates")}
                  numberOfMonths={1}
                />
              </div>
              <ListboxField
                label={t("avail.guests")}
                value={guests}
                onChange={setGuests}
                options={guestOptions}
              />
            </div>
            <p className="my-4 text-[0.82rem] font-semibold text-strike">
              {t("bk.cancel")}
            </p>
            <button
              type="button"
              onClick={() => goStep(2)}
              className="rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white hover:bg-brand-2"
            >
              {t("bk.seeRooms")} →
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rounded-[14px] bg-white p-9 shadow-panel">
            <h2 className="mb-1 text-2xl">{t("bk.choose")}</h2>
            <p className="mb-5 text-[0.85rem] font-semibold text-strike">
              {isoDate(checkIn)} → {isoDate(checkOut)} · {nights}{" "}
              {nights > 1 ? t("bk.nights") : t("bk.night")}
            </p>
            <div className="space-y-3.5">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setRoomKey(room.shortKey)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-[14px] border-2 p-4 text-left transition",
                    roomKey === room.shortKey
                      ? "border-brand bg-brand/5"
                      : "border-line hover:border-gold"
                  )}
                >
                  <div className="relative h-[90px] w-[120px] shrink-0 overflow-hidden rounded-[10px]">
                    <SafeImage
                      src={room.photos[0]}
                      alt={tr(room.name)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg">{tr(room.name)}</h3>
                    <p className="text-[0.78rem] font-semibold text-strike">
                      {tr(room.meta)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl">{formatBaht(room.rate)}</div>
                    <div className="text-[0.7rem] font-bold text-strike">
                      <s>{formatBaht(room.ota)}</s> {t("chip.via")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => goStep(1)}
                className="rounded-full border border-ink/25 px-5 py-3 text-sm font-bold"
              >
                ←
              </button>
              <button
                type="button"
                disabled={!roomKey}
                onClick={() => goStep(3)}
                className="rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {t("bk.continue")} →
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && selectedRoom ? (
          <div className="rounded-[14px] bg-white p-9 shadow-panel">
            <h2 className="mb-5 text-2xl">{t("bk.secure")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-gold">
                  {t("bk.name")}
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("bk.nameph")}
                  className="w-full rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-sm font-semibold"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-gold">
                  {t("bk.mail")}
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-sm font-semibold"
                />
              </label>
            </div>

            <div className="my-5 rounded-xl bg-surface-2 p-5 text-[0.92rem]">
              <div className="flex justify-between py-1.5">
                <span>
                  {tr(selectedRoom.name)} · {nights}{" "}
                  {nights > 1 ? t("bk.nights") : t("bk.night")}
                </span>
                <span>{formatBaht(total)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-deal">
                <span>{t("bk.save")}</span>
                <span className="font-extrabold">-{formatBaht(save)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-3 font-extrabold">
                <span>{t("bk.dep")}</span>
                <span>{formatBaht(deposit)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[0.8rem] text-strike">
                <span>{t("bk.bal")}</span>
                <span>{formatBaht(total - deposit)}</span>
              </div>
            </div>

            <div className="mb-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPayMethod("promptpay")}
                className={cn(
                  "flex-1 rounded-[10px] border-2 py-3 text-sm font-extrabold",
                  payMethod === "promptpay"
                    ? "border-brand bg-brand/5"
                    : "border-line"
                )}
              >
                PromptPay
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("card")}
                className={cn(
                  "flex-1 rounded-[10px] border-2 py-3 text-sm font-extrabold",
                  payMethod === "card" ? "border-brand bg-brand/5" : "border-line"
                )}
              >
                {t("bk.card")}
              </button>
            </div>

            {payMethod === "promptpay" ? (
              <div className="grid place-items-center rounded-xl bg-surface-2 p-6">
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 21 21"
                  shapeRendering="crispEdges"
                  dangerouslySetInnerHTML={{ __html: qrMockSvg() }}
                />
                <p className="mt-3 text-[0.78rem] font-bold text-strike">
                  {t("bk.scan")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-gold">
                    {t("bk.cardNum")}
                  </span>
                  <input
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-sm font-semibold"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-gold">
                    {t("bk.expiry")}
                  </span>
                  <input
                    placeholder="12/28"
                    className="w-full rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-sm font-semibold"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-gold">
                    CVC
                  </span>
                  <input
                    placeholder="123"
                    className="w-full rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-sm font-semibold"
                  />
                </label>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => goStep(2)}
                className="rounded-full border border-ink/25 px-5 py-3 text-sm font-bold"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => {
                  setCode(generateBookingCode());
                  goStep(4);
                }}
                className="rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-white"
              >
                {t("bk.pay")} {formatBaht(deposit)}
              </button>
            </div>
            <p className="mt-3.5 text-[0.72rem] font-semibold text-strike">
              {t("bk.demo")}
            </p>
          </div>
        ) : null}

        {step === 4 && selectedRoom ? (
          <>
            <div className="relative overflow-hidden rounded-[14px] bg-brand p-9 text-white shadow-panel">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(90deg,#B9853D_0_14px,transparent_14px_24px)]" />
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
                {t("bk.done")}
              </p>
              <div className="mt-2 font-display text-[2rem] tracking-wide text-gold">
                {code}
              </div>
              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                <div>
                  <b className="block text-[0.68rem] uppercase tracking-[0.16em] text-gold">
                    {t("bk.s2")}
                  </b>
                  {tr(selectedRoom.name)}
                </div>
                <div>
                  <b className="block text-[0.68rem] uppercase tracking-[0.16em] text-gold">
                    {t("avail.guests")}
                  </b>
                  {guests}
                </div>
                <div>
                  <b className="block text-[0.68rem] uppercase tracking-[0.16em] text-gold">
                    {t("avail.in")}
                  </b>
                  {isoDate(checkIn)} · 14:00
                </div>
                <div>
                  <b className="block text-[0.68rem] uppercase tracking-[0.16em] text-gold">
                    {t("avail.out")}
                  </b>
                  {isoDate(checkOut)} · 12:00
                </div>
                <div>
                  <b className="block text-[0.68rem] uppercase tracking-[0.16em] text-gold">
                    {t("bk.dep")}
                  </b>
                  {formatBaht(deposit)}
                </div>
                <div>
                  <b className="block text-[0.68rem] uppercase tracking-[0.16em] text-gold">
                    {t("bk.bal")}
                  </b>
                  {formatBaht(total - deposit)}
                </div>
              </div>
              <p className="mt-6 text-[0.9rem] opacity-85">{t("bk.sent")}</p>
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full border border-ink/25 px-7 py-3.5 text-sm font-bold"
            >
              {t("bk.back")}
            </Link>
          </>
        ) : null}
      </div>
    </section>
  );
}
