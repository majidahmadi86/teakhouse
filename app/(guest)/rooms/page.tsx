import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { SEED_ROOMS } from "@/lib/rooms";
import { getServerLocale, t, tr } from "@/lib/serverLocale";
import { formatBaht } from "@/lib/utils";

const INCLUDED = ["rp.i1", "rp.i2", "rp.i3", "rp.i4", "rp.i5", "rp.i6"] as const;

/**
 * RSC rooms listing · no rooms-page client bundle.
 *
 * Every string here used to be an English literal, and the cards read
 * `room.name.en` / `room.meta.en` directly, so this page stayed in English no
 * matter what language the guest had chosen · it was the largest single block
 * of leakage on the Thai site. It now resolves the same dictionary keys the
 * rest of the site uses, and reads the room's bilingual fields through tr().
 *
 * Room NAMES stay as they are: they are the property's own names, and the seed
 * carries them identically in both slots on purpose.
 */
export default function RoomsPage() {
  const locale = getServerLocale();
  const rooms = SEED_ROOMS.filter((r) => r.active);

  return (
    <>
      <PageHero
        image="/hero-lcp-640.avif"
        imageAvif="/hero-lcp-640.avif"
        alt={t(locale, "rp.heroAlt")}
        eyebrow={t(locale, "rooms.eyebrow")}
        title={t(locale, "rp.h1")}
        lead={t(locale, "rp.lead")}
        objectPosition="center 40%"
      />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-7 md:grid-cols-2">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="group tkh-card flex flex-col overflow-hidden"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SafeImage
                    src={room.photos[0]}
                    alt={tr(locale, room.name)}
                    fill
                    sizes="(max-width: 768px) 100vw, 560px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-xl text-navy">
                    {tr(locale, room.name)}
                  </h2>
                  <p className="mt-1 text-sm text-sub">{tr(locale, room.meta)}</p>
                  <p className="mt-4 text-lg font-bold text-navy">
                    {t(locale, "room.from")} {formatBaht(room.rate)}
                    <span className="text-sm font-semibold text-sub">
                      {" "}
                      {t(locale, "room.night")}
                    </span>
                  </p>
                  <div className="mt-auto flex gap-3 pt-5">
                    <Link
                      href={`/rooms/${room.slug}`}
                      prefetch={false}
                      className="btn-secondary flex-1 text-center"
                    >
                      {t(locale, "room.see")}
                    </Link>
                    <Link
                      href={`/book?room=${room.slug}`}
                      prefetch={false}
                      className="btn-primary flex-1 text-center"
                    >
                      {t(locale, "room.book")}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <h2>{t(locale, "rp.inc")}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((key) => (
              <article key={key} className="tkh-card p-6">
                <h3 className="text-lg">{t(locale, key)}</h3>
              </article>
            ))}
          </div>
          <p className="mt-12 text-center">
            <Link href="/book" prefetch={false} className="btn-primary">
              {t(locale, "nav.book")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
