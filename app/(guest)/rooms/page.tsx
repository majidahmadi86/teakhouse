import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { SEED_ROOMS } from "@/lib/rooms";

/**
 * RSC rooms listing · EN seed copy · no rooms-page client bundle.
 * (Lang/currency live in deferred Header · cards use seed EN.)
 */
export default function RoomsPage() {
  const rooms = SEED_ROOMS.filter((r) => r.active);

  return (
    <>
      <PageHero
        image="/hero-lcp-640.avif"
        imageAvif="/hero-lcp-640.avif"
        alt="Teak hotel room interior"
        eyebrow="Stay"
        title="Rooms and rates"
        lead="Twelve teak rooms above the Chao Phraya. Every rate below is the direct price."
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
                    alt={room.name.en}
                    fill
                    sizes="(max-width: 768px) 100vw, 560px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-xl text-navy">{room.name.en}</h2>
                  <p className="mt-1 text-sm text-sub">{room.meta.en}</p>
                  <p className="mt-4 text-lg font-bold text-navy">
                    from ฿{room.rate.toLocaleString()}
                    <span className="text-sm font-semibold text-sub"> / night</span>
                  </p>
                  <div className="mt-auto flex gap-3 pt-5">
                    <Link
                      href={`/rooms/${room.slug}`}
                      prefetch={false}
                      className="btn-secondary flex-1 text-center"
                    >
                      See room
                    </Link>
                    <Link
                      href={`/book?room=${room.slug}`}
                      prefetch={false}
                      className="btn-primary flex-1 text-center"
                    >
                      Book
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
          <h2>All rooms include</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Breakfast on the pier",
              "Fast Wi-Fi and workspace",
              "Saltwater courtyard pool",
              "24-hour house desk",
              "Free cancellation to 3 days",
              "Filtered water, no plastic",
            ].map((label) => (
              <article key={label} className="tkh-card p-6">
                <h3 className="text-lg">{label}</h3>
              </article>
            ))}
          </div>
          <p className="mt-12 text-center">
            <Link href="/book" prefetch={false} className="btn-primary">
              Book direct
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
