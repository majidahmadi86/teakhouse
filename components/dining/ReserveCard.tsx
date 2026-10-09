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
 * A white card with a hairline border and soft shadow · it should read as
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
    <aside className="sticky top-[calc(var(--demo-bar-h)+var(--header-h)+1.5rem)] hidden self-start lg:block">
      <div className="overflow-hidden rounded-card border border-line/80 bg-white text-ink shadow-soft">
        <div className="p-6 md:p-7">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-teak">
            {t(locale, "rsv.cardEyebrow")}
          </p>
          <h3 className="mt-2 font-display text-[1.5rem] leading-tight text-ink">
            {t(locale, "rsv.cardH")}
          </h3>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink/70">
            {t(locale, "rsv.cardP")}
          </p>

          <form action="/dining/reserve" method="get" className="mt-5 space-y-3">
            <div>
              <label
                htmlFor="card-date"
                className="field-label"
              >
                {t(locale, "rsv.date")}
              </label>
              <input
                id="card-date"
                name="date"
                type="date"
                defaultValue={todayIso}
                min={todayIso}
                className="min-h-[44px] w-full rounded-soft border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="card-time"
                  className="field-label"
                >
                  {t(locale, "rsv.time")}
                </label>
                <select
                  id="card-time"
                  name="time"
                  defaultValue={preferred}
                  className="min-h-[44px] w-full rounded-soft border border-line bg-white px-3 py-2.5 text-[15px] text-ink"
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
                  className="field-label"
                >
                  {t(locale, "rsv.party")}
                </label>
                <select
                  id="card-party"
                  name="party"
                  defaultValue="2"
                  className="min-h-[44px] w-full rounded-soft border border-line bg-white px-3 py-2.5 text-[15px] text-ink"
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
              className="btn-primary mt-1 w-full"
            >
              {t(locale, "rsv.cta")}
            </button>
          </form>

          <p className="mt-3.5 text-center text-[13px] text-sub">
            {t(locale, "rsv.noDeposit")}
          </p>
        </div>
      </div>

      <p className="mt-4 px-1 text-[13.5px] leading-relaxed text-sub">
        {t(locale, "rsv.window", {
          w: formatServiceWindow(serviceStart, serviceEnd, locale),
        })}
      </p>
    </aside>
  );
}
