"use client";

import Link from "next/link";
import { useState } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ListboxField } from "@/components/ui/ListboxField";
import { useCurrency } from "@/lib/currency";
import { I18nProvider, useI18n, type Lang, type Messages } from "@/lib/i18n";
import { addDays, hotelToday, isoDate, nightsBetween } from "@/lib/utils";

type RoomBookingProps = {
  shortKey: string;
  rate: number;
  ota: number;
};

/**
 * The room page's booking rail (desktop, sticky) and its phone bar · ONE
 * island with one state, rendered in both places (CSS shows one of them).
 * It brings its own language strings (the page language's booking keys, as
 * props), since the guest layout has no provider tree.
 */
export function RoomBooking({
  lang,
  messages,
  ...room
}: RoomBookingProps & { lang: Lang; messages: Messages }) {
  return (
    <I18nProvider initialLang={lang} messages={messages}>
      <RoomBookingInner {...room} />
    </I18nProvider>
  );
}

function RoomBookingInner({ shortKey, rate, ota }: RoomBookingProps) {
  const { t } = useI18n();
  const { format } = useCurrency();
  const [checkIn, setCheckIn] = useState<Date | undefined>(() => addDays(hotelToday(), 1));
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => addDays(hotelToday(), 2));
  const [guests, setGuests] = useState("2");

  const inDate = checkIn ?? addDays(hotelToday(), 1);
  const outDate = checkOut ?? addDays(inDate, 1);
  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? nightsBetween(isoDate(checkIn), isoDate(checkOut))
      : 0;
  const total = rate * nights;
  const save = (ota - rate) * nights;

  const guestOptions = ["1", "2", "3", "4"].map((n) => ({
    value: n,
    label: t(`g${n}`),
  }));

  const bookHref = `/book?room=${shortKey}&in=${isoDate(inDate)}&out=${isoDate(outDate)}&g=${guests}`;

  const rail = (
    <div className="rounded-[14px] bg-white p-6 shadow-panel">
      <div className="space-y-4">
        <DateRangePicker
          from={checkIn}
          to={checkOut}
          onChange={(from, to) => {
            setCheckIn(from);
            setCheckOut(to);
          }}
          placeholder={t("avail.selectDates")}
          numberOfMonths={1}
        />
        <ListboxField
          label={t("avail.guests")}
          value={guests}
          onChange={setGuests}
          options={guestOptions}
        />
      </div>
      <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <span>
            {format(rate)} x {nights} {nights > 1 ? t("bk.nights") : t("bk.night")}
          </span>
          <span className="font-semibold">{format(total)}</span>
        </div>
        <div className="flex justify-between text-deal">
          <span>{t("bk.save")}</span>
          <span className="font-bold">-{format(save)}</span>
        </div>
      </div>
      <Link
        href={bookHref}
        className="mt-5 flex w-full items-center justify-center rounded-full bg-blue py-3.5 text-sm font-bold text-white transition hover:bg-blue-dark"
      >
        {t("rooms.bookThis")}
      </Link>
    </div>
  );

  return (
    <>
      <div className="hidden lg:sticky lg:top-24 lg:block">{rail}</div>
      <div className="z-sticky fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-4 pb-safe backdrop-blur-md lg:hidden">
        {rail}
      </div>
    </>
  );
}
