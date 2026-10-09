import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Picture } from "@/components/Picture";
import { Price } from "@/components/Price";
import { RoomCard } from "@/components/rooms/RoomCard";
import { StaySearch } from "@/components/stay/StaySearch";
import { StayTotals } from "@/components/stay/StayTotals";
import { AMENITIES, type AmenityGroup } from "@/lib/amenities";
import { CONDITIONS, CONDITIONS_TITLE } from "@/lib/conditions";
import { isImageId } from "@/lib/images";
import { catalogueRoom, ROOM_CATALOGUE } from "@/lib/rooms";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { cn } from "@/lib/utils";

type Props = {
  params: LangParams & { slug: string };
};

const GROUPS: AmenityGroup[] = ["room", "bathroom", "comfort", "services"];
const SECTION_KEY: Record<AmenityGroup, string> = {
  room: "sec.room",
  bathroom: "sec.bathroom",
  comfort: "sec.comfort",
  services: "sec.services",
};

export function generateStaticParams() {
  return ROOM_CATALOGUE.map((room) => ({ slug: room.slug }));
}

/**
 * A room · server HTML from the catalogue (lib/rooms.ts). Its own
 * photographs only, a calm description, what a direct booking includes, the
 * amenities as words, and the booking rail: a StaySearch form (GET /book with
 * this room) whose only island is its running total. Every price is a
 * <Price>, so the currency select converts all of them.
 */
export default function RoomDetailPage({ params }: Props) {
  const locale = pageLang(params);
  const { slug } = params;
  const room = catalogueRoom(slug);
  if (!room) notFound();
  if (room.slug !== slug) redirect(`/rooms/${room.slug}`);

  const name = tr(locale, room.name);
  const photos = room.images.filter((p) => isImageId(p.id));
  const [cover, ...rest] = photos;
  const side = rest.slice(0, 3);
  const more: typeof rest = [];
  const others = ROOM_CATALOGUE.filter((r) => r.slug !== room.slug).slice(0, 3);

  const facts = [
    { k: "room.size", v: `${room.sizeM2} m²` },
    { k: "room.beds", v: tr(locale, room.beds) },
    { k: "room.view", v: tr(locale, room.view) },
    { k: "room.sleeps", v: t(locale, "rooms.sleeps", { n: room.capacity }) },
  ];

  return (
    <>
      <section className="bg-stone">
        <div className="wrap pt-8 md:pt-12">
          <nav className="text-[13.5px] text-sub" aria-label={t(locale, "a11y.breadcrumb")}>
            <Link href="/rooms" prefetch={false} className="link-draw text-ink/80 hover:text-ink">
              {t(locale, "rooms.crumb")}
            </Link>
            <span className="mx-2 text-line" aria-hidden>
              /
            </span>
            <span className="text-ink">{name}</span>
          </nav>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[760px]">
              <p className="eyebrow">{tr(locale, room.floor)}</p>
              <h1 className="mt-3">{name}</h1>
              <p className="lead mt-4">{tr(locale, room.intro)}</p>
            </div>
            <p className="text-[15px] text-sub">
              {t(locale, "room.from")}{" "}
              <span className="font-display text-[30px] text-ink">
                <Price thb={room.rate} />
              </span>{" "}
              {t(locale, "room.night")}
            </p>
          </div>
        </div>

        {/* The room's own photographs · cover large, the rest beside it. */}
        <div className="wrap mt-8 md:mt-10">
          <div className={cn("grid gap-2 md:gap-3", side.length ? "md:grid-cols-[2fr_1fr]" : "")}>
            {cover ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory md:aspect-[3/2]">
                <Picture
                  id={cover.id as never}
                  alt={tr(locale, cover.alt)}
                  sizes="(max-width: 767px) calc(100vw - 40px), 800px"
                  priority
                  fill
                />
              </div>
            ) : null}
            {side.length ? (
              <div className={cn("grid gap-2 md:gap-3", side.length === 3 ? "grid-cols-3 md:grid-cols-1 md:grid-rows-3" : side.length === 2 ? "grid-cols-2 md:grid-cols-1 md:grid-rows-2" : "")}>
                {side.map((p) => (
                  <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory md:aspect-auto">
                    <Picture id={p.id as never} alt={tr(locale, p.alt)} sizes="(max-width: 767px) 50vw, 400px" fill unveil />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {more.length ? (
            <div className="mt-2 grid grid-cols-2 gap-2 md:mt-3 md:grid-cols-4 md:gap-3">
              {more.map((p) => (
                <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory">
                  <Picture id={p.id as never} alt={tr(locale, p.alt)} sizes="(max-width: 767px) 50vw, 300px" fill unveil />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-stone pb-32 pt-12 md:pt-16 lg:pb-24">
        <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
          <div className="min-w-0">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-6 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.k}>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-sub">{t(locale, f.k)}</dt>
                  <dd className="mt-1.5 text-[16px] text-ink">{f.v}</dd>
                </div>
              ))}
            </dl>

            <p className="lead mt-10 max-w-[64ch]">{tr(locale, room.description)}</p>

            <div className="mt-14">
              <h2 className="text-[clamp(1.6rem,2.4vw,2.1rem)]">{t(locale, "room.included")}</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {room.inclusions.map((inc) => (
                  <li key={inc.en} className="flex gap-3 text-[16px] text-ink/85">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-forest" aria-hidden />
                    {tr(locale, inc)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-14">
              <h2 className="text-[clamp(1.6rem,2.4vw,2.1rem)]">{t(locale, "rooms.amenities")}</h2>
              <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {GROUPS.map((group) => {
                  const items = room.amenities.filter((id) => AMENITIES[id].group === group);
                  if (items.length === 0) return null;
                  return (
                    <div key={group}>
                      <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-teak">
                        {t(locale, SECTION_KEY[group])}
                      </h3>
                      <ul className="mt-3 divide-y divide-line border-t border-line">
                        {items.map((id) => (
                          <li key={id} className="py-2.5 text-[15.5px] text-ink/85">
                            {tr(locale, AMENITIES[id])}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-14 rounded-card border border-line/80 bg-white p-6 md:p-8">
              <h2 className="text-[22px]">{tr(locale, CONDITIONS_TITLE)}</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {CONDITIONS.map((item) => (
                  <li key={item.en} className="flex gap-2.5 text-[15px] text-ink/80">
                    <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-teak-light" aria-hidden />
                    {tr(locale, item)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The booking rail · a StaySearch form (GET /book with this room). */}
          <div id="book-room" className="scroll-mt-28 lg:sticky lg:top-[calc(var(--demo-bar-h)+var(--header-h)+1.5rem)]">
            <div className="rounded-card border border-line/80 bg-white p-6 shadow-soft md:p-7">
              <p className="font-display text-[22px] text-ink">{t(locale, "rooms.bookThis")}</p>
              <p className="mt-1 text-[14px] text-sub">{t(locale, "room.bestRate")}</p>
              <StaySearch
                locale={locale}
                variant="rail"
                room={room.slug}
                submitLabel={t(locale, "avail.go")}
                className="mt-5"
              >
                <StayTotals
                  rate={room.rate}
                  ota={room.ota}
                  nightLabel={t(locale, "bk.night")}
                  nightsLabel={t(locale, "bk.nights")}
                  saveLabel={t(locale, "bk.save")}
                />
              </StaySearch>
            </div>
          </div>
        </div>
      </section>

      {/* Phones · the room's rate and a way to its rail, always at hand. */}
      <div className="z-sticky fixed inset-x-0 bottom-0 border-t border-line bg-white/95 px-4 pt-3 pb-safe shadow-dock backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <p className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] text-sub">{name}</span>
            <span className="block whitespace-nowrap text-[17px] font-semibold text-ink">
              <Price thb={room.rate} /> <span className="text-[13px] font-normal text-sub">{t(locale, "room.night")}</span>
            </span>
          </p>
          <a href="#book-room" className="btn-primary h-12 shrink-0 px-6 text-[15px]">
            {t(locale, "avail.go")}
          </a>
        </div>
      </div>

      <section className="border-t border-line bg-white px-5 pb-32 pt-20 sm:px-8 lg:pb-24">
        <div className="mx-auto max-w-site">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2>{t(locale, "rooms.other")}</h2>
            <Link href="/rooms" prefetch={false} className="link-quiet">
              {t(locale, "rooms.all")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <RoomCard
                key={other.slug}
                room={other}
                locale={locale}
                sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 400px"
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
