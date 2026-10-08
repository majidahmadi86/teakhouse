import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Price } from "@/components/Price";
import { PriceChip } from "@/components/PriceChip";
import { StaySearch } from "@/components/stay/StaySearch";
import { StayTotals } from "@/components/stay/StayTotals";
import { RoomGallery } from "@/components/room/RoomGallery";
import { AmenityIcon } from "@/components/ui/AmenityIcon";
import { AMENITIES, type AmenityGroup, type AmenityId } from "@/lib/amenities";
import { CONDITIONS, CONDITIONS_TITLE } from "@/lib/conditions";
import { getSeedGuestRooms } from "@/lib/guestRooms";
import { getRoomByKey, getRoomBySlug, SEED_ROOMS } from "@/lib/rooms";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";

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
  return SEED_ROOMS.map((room) => ({ slug: room.slug }));
}

/**
 * A room · server HTML (it was one 360-line client component). What stays
 * interactive is the photo gallery with its lightbox (an island) and the
 * booking rail, a StaySearch form (GET /book with this room) whose only island
 * is its running total. Every price on the page is a <Price>, so the currency
 * select converts all of them.
 */
export default function RoomDetailPage({ params }: Props) {
  const locale = pageLang(params);
  const { slug } = params;
  const room = getRoomBySlug(slug) ?? getRoomByKey(slug);
  if (!room) notFound();
  if (room.slug !== slug) redirect(`/rooms/${room.slug}`);

  const name = tr(locale, room.name);
  const photos = room.photos.slice(0, 6);
  const otherRooms = getSeedGuestRooms().filter((r) => r.slug !== room.slug);

  const rail = (key: "desk" | "phone") => (
    <div key={key} className={key === "phone" ? "" : "rounded-[14px] bg-white p-6 shadow-panel"}>
      <StaySearch
        locale={locale}
        variant="rail"
        compact={key === "phone"}
        room={room.shortKey}
        submitLabel={t(locale, "rooms.bookThis")}
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
  );

  return (
    <>
      <section className="min-h-screen bg-white px-6 pb-8 pt-6 md:pt-8">
        <div className="mx-auto max-w-[1180px]">
          <nav className="mb-2 text-[13px] font-semibold text-sub">
            <Link href="/rooms" className="link-draw text-blue">
              {t(locale, "rooms.crumb")}
            </Link>
            <span className="mx-2 text-line">/</span>
            <span className="text-ink">{name}</span>
          </nav>
          <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-tight text-ink">
            {name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {[room.meta, room.floor].map((chip) => (
              <span
                key={chip.en}
                className="rounded-full border border-line bg-cloud px-3 py-1 text-xs font-bold text-ink/80"
              >
                {tr(locale, chip)}
              </span>
            ))}
          </div>

          <RoomGallery
            photos={photos}
            name={name}
            photoLabels={photos.map((_, i) => `${name} photo ${i + 1}`)}
            closeLabel={t(locale, "mobile.close")}
            prevLabel={t(locale, "a11y.prev")}
            nextLabel={t(locale, "a11y.next")}
          />

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <PriceChip locale={locale} rate={room.rate} ota={room.ota} showSave />
              </div>
              <p className="mt-6 max-w-prose text-[1.05rem] leading-relaxed text-ink/85">
                {tr(locale, room.description)}
              </p>

              <div className="mt-12">
                <h2 className="mb-6 text-2xl">{t(locale, "rooms.amenities")}</h2>
                <div className="space-y-8">
                  {GROUPS.map((group) => {
                    const items = room.amenities.filter((id) => AMENITIES[id].group === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group}>
                        <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-blue">
                          {t(locale, SECTION_KEY[group])}
                        </h3>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {items.map((id) => {
                            const amenity = AMENITIES[id as AmenityId];
                            return (
                              <li
                                key={id}
                                className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm"
                              >
                                <AmenityIcon name={amenity.icon} className="text-blue" />
                                <span className="text-sm font-semibold">{tr(locale, amenity)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-12 rounded-[14px] bg-white p-6 shadow-panel">
                <h2 className="mb-4 text-xl">{tr(locale, CONDITIONS_TITLE)}</h2>
                <ul className="space-y-2">
                  {CONDITIONS.map((item) => (
                    <li
                      key={item.en}
                      className="flex gap-2 text-sm font-semibold text-ink/85 before:text-blue before:content-['·']"
                    >
                      {tr(locale, item)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* The booking rail · a StaySearch form (GET /book with this room),
                sticky on desktop, a bottom card on phones. */}
            <div className="hidden lg:sticky lg:top-24 lg:block">{rail("desk")}</div>
            <div className="z-sticky fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-4 pb-safe backdrop-blur-md lg:hidden">
              {rail("phone")}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-24 pb-40 lg:pb-24">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-8">{t(locale, "rooms.other")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherRooms.map((other) => (
              <Link
                key={other.id}
                href={`/rooms/${other.slug}`}
                className="group overflow-hidden rounded-[14px] bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={other.photos[0]}
                    alt={tr(locale, other.name)}
                    fill
                    quality={70}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg">{tr(locale, other.name)}</h3>
                  <p className="text-sm font-semibold text-strike">{tr(locale, other.meta)}</p>
                  <p className="mt-1 font-display text-xl">
                    <Price thb={other.rate} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
