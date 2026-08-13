import Link from "next/link";
import { formatServiceWindow, serviceSlots } from "@/lib/reservations";
import { t, type Lang } from "@/lib/serverLocale";

/**
 * Desktop reservation card · sticky beside the menu, so the way to book a
 * table is on screen at every scroll depth instead of only at the top and
 * bottom of a long menu.
 *
 * A pure server component with no client JS: the date, time and party inputs
 * are a plain GET form that lands on /dining/reserve with those values
 * prefilled, so it works with JavaScript disabled like everything else here.
 * Brand navy ground with a gold rule and a soft glass edge · it should read as
 * part of the house, not a widget bolted on.
 */
export function ReserveCard({
  locale,
  serviceStart,
  serviceEnd,
  maxPartySize,
  todayIso,
}: {
  locale: Lang;
  serviceStart: string;
  serviceEnd: string;
  maxPartySize: number;
  todayIso: string;
}) {
  const slots = serviceSlots(serviceStart, serviceEnd);
  // A sensible default sitting · 19:00 if the kitchen is open then, else the
  // middle of service rather than the very first slot of the day.
  const preferred = slots.includes("19:00")
    ? "19:00"
    : slots[Math.floor(slots.length / 2)] ?? slots[0];

  return (
    /* self-start matters: a grid item stretches to the row height by default,
       which made this aside as tall as the whole menu and left sticky with
       nothing to stick inside. Shrinking it to its content is what lets it
       follow the scroll. */
    <aside className="sticky top-24 hidden self-start lg:block">
      <div className="overflow-hidden rounded-[18px] bg-navy text-white shadow-[0_24px_60px_rgba(10,27,46,.28),inset_0_1px_0_rgba(255,255,255,.10)]">
        <div className="h-[3px] w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
        <div className="p-6">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-gold">
            {t(locale, "rsv.cardEyebrow")}
          </p>
          <h3 className="mt-2 font-display text-[1.45rem] leading-tight text-white">
            {t(locale, "rsv.cardH")}
          </h3>
          <p className="mt-2.5 text-[0.9rem] leading-relaxed text-[#FFFFFFA6]">
            {t(locale, "rsv.cardP")}
          </p>

          <form action="/dining/reserve" method="get" className="mt-5 space-y-3">
            <div>
              <label
                htmlFor="card-date"
                className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#FFFFFF8C]"
              >
                {t(locale, "rsv.date")}
              </label>
              <input
                id="card-date"
                name="date"
                type="date"
                defaultValue={todayIso}
                min={todayIso}
                className="min-h-[44px] w-full rounded-[10px] border-0 bg-[#FFFFFF14] px-3.5 py-2.5 text-[0.95rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)] [color-scheme:dark]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="card-time"
                  className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#FFFFFF8C]"
                >
                  {t(locale, "rsv.time")}
                </label>
                <select
                  id="card-time"
                  name="time"
                  defaultValue={preferred}
                  className="min-h-[44px] w-full rounded-[10px] border-0 bg-[#FFFFFF14] px-3 py-2.5 text-[0.95rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)] [color-scheme:dark]"
                >
                  {slots.map((slot) => (
                    <option key={slot} value={slot} className="text-ink">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="card-party"
                  className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#FFFFFF8C]"
                >
                  {t(locale, "rsv.party")}
                </label>
                <select
                  id="card-party"
                  name="party"
                  defaultValue="2"
                  className="min-h-[44px] w-full rounded-[10px] border-0 bg-[#FFFFFF14] px-3 py-2.5 text-[0.95rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)] [color-scheme:dark]"
                >
                  {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} className="text-ink">
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-shine mt-1 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-5 text-[0.95rem] font-extrabold text-navy transition hover:brightness-105"
            >
              {t(locale, "rsv.cta")}
            </button>
          </form>

          <p className="mt-3.5 text-center text-[0.78rem] text-[#FFFFFF8C]">
            {t(locale, "rsv.noDeposit")}
          </p>
        </div>
      </div>

      <p className="mt-4 px-1 text-[0.82rem] leading-relaxed text-sub">
        {t(locale, "rsv.window", {
          w: formatServiceWindow(serviceStart, serviceEnd, locale),
        })}
      </p>
    </aside>
  );
}
