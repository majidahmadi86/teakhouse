"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Calendar, MessageCircle, User } from "lucide-react";
import { RoomCard } from "@/components/RoomCard";
import { SafeImage } from "@/components/SafeImage";
import { useGuestRooms } from "@/lib/ownerStore";
import { useI18n } from "@/lib/i18n";

const AvailBar = dynamic(
  () => import("@/components/AvailBar").then((m) => m.AvailBar),
  {
    ssr: false,
    loading: () => (
      <div className="h-[72px] animate-pulse rounded-2xl bg-white/90 shadow-2xl" />
    ),
  }
);

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1600&q=80";

const TRUST_KEYS = ["trust.1", "trust.2", "trust.3", "trust.4"] as const;

function TrustBadges({ mobile }: { mobile?: boolean }) {
  const { t } = useI18n();

  if (mobile) {
    return (
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {TRUST_KEYS.map((key) => (
          <li
            key={key}
            className="text-[13px] font-semibold text-ink/80"
          >
            {t(key)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 text-[13px] font-semibold text-white/90">
      {TRUST_KEYS.map((key, i) => (
        <span key={key} className="inline-flex items-center gap-2">
          {i > 0 ? <span aria-hidden>·</span> : null}
          {t(key)}
        </span>
      ))}
    </p>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const rooms = useGuestRooms().slice(0, 3);

  return (
    <>
      <section className="relative bg-cloud md:h-[78svh]">
        <div className="relative h-[58svh] overflow-hidden md:absolute md:inset-0 md:h-full">
          <SafeImage
            src={HERO_IMAGE}
            alt="Chao Phraya river at dusk, Bangkok"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="hero-scrim absolute inset-0" />
          <div className="nav-scrim pointer-events-none absolute inset-x-0 top-0 h-36" />

          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-6 pt-28 md:pb-8">
            <div className="mx-auto w-full max-w-[1180px]">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amber hero-text-shadow">
                {t("hero.eyebrow")}
              </p>
              <h1 className="max-w-[14ch] font-display text-[2.1rem] leading-[1.05] text-white hero-text-shadow md:max-w-[16ch] md:text-[clamp(2.8rem,5vw,4.6rem)]">
                {t("hero.h1")}
              </h1>
              <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/90 hero-text-shadow">
                {t("hero.lead")}
              </p>

              <div className="mt-8 hidden md:block">
                <AvailBar variant="hero" showNote={false} />
                <TrustBadges />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 md:hidden">
          <AvailBar variant="hero" showNote={false} />
          <TrustBadges mobile />
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-[1180px] items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-amber">
              {t("about.eyebrow")}
            </p>
            <h2>{t("about.h2")}</h2>
            <p className="mt-5 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t("about.p")}
            </p>
            <Link
              href="/rooms"
              className="mt-8 inline-flex rounded-full bg-navy px-7 py-3.5 text-sm font-bold text-white transition hover:bg-blue-dark"
            >
              {t("about.cta")}
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[14px] shadow-panel">
            <SafeImage
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
              alt="Teak house interior"
              width={1200}
              height={1500}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-24">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[640px]">
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-amber">
              {t("rooms.eyebrow")}
            </p>
            <h2>{t("rooms.h2")}</h2>
            <p className="mt-4 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t("rooms.p")}
            </p>
          </div>
          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
          <p className="mt-10 text-center">
            <Link
              href="/rooms"
              className="inline-flex rounded-full border border-ink/25 px-7 py-3.5 text-sm font-bold transition hover:border-blue hover:bg-sky"
            >
              {t("rooms.all")}
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-navy px-6 py-24 text-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[620px]">
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-amber">
              {t("sys.eyebrow")}
            </p>
            <h2>{t("sys.h2")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-white/80">
              {t("sys.p")}
            </p>
          </div>
          <div className="mt-12 grid gap-7 md:grid-cols-3">
            {[
              { icon: MessageCircle, h: "sys.f1h", p: "sys.f1p" },
              { icon: Calendar, h: "sys.f2h", p: "sys.f2p" },
              { icon: User, h: "sys.f3h", p: "sys.f3p" },
            ].map(({ icon: Icon, h, p }) => (
              <article
                key={h}
                className="rounded-[14px] border border-white/15 bg-white/5 p-7"
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-blue">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-xl">{t(h)}</h3>
                <p className="text-[0.94rem] text-white/78">{t(p)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[620px]">
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-amber">
              {t("rev.eyebrow")}
            </p>
            <h2>{t("rev.h2")}</h2>
          </div>
          <div className="mt-12 grid gap-7 md:grid-cols-3">
            {(["1", "2", "3"] as const).map((n) => (
              <article
                key={n}
                className="rounded-[14px] bg-white p-8 shadow-[0_8px_30px_rgba(23,33,29,0.07)]"
              >
                <div className="mb-3 tracking-[3px] text-amber">★★★★★</div>
                <p className="text-[0.95rem]">{t(`rev.${n}`)}</p>
                <footer className="mt-4 text-[0.8rem] font-bold text-strike">
                  {t(`rev.${n}a`)}
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-16 text-center">
        <div className="mx-auto max-w-[1180px]">
          <h2>{t("cta.h2")}</h2>
          <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
            {t("cta.p")}
          </p>
          <Link
            href="/book"
            className="mt-8 inline-flex rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white transition hover:bg-blue-dark"
          >
            {t("cta.btn")}
          </Link>
        </div>
      </section>
    </>
  );
}
