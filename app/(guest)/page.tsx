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
      <div className="h-[88px] animate-pulse rounded-2xl bg-white/90 shadow-panel" />
    ),
  }
);
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600&q=70";

export default function HomePage() {
  const { t } = useI18n();
  const rooms = useGuestRooms().slice(0, 3);

  return (
    <>
      <section className="relative flex min-h-[100svh] items-end overflow-hidden pb-64 text-white md:pb-[150px]">
        <div className="absolute inset-0 -z-10">
          <SafeImage
            src={HERO_IMAGE}
            alt="Chao Phraya river at dusk"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="hero-scrim absolute inset-0" />
          <div className="nav-scrim pointer-events-none absolute inset-x-0 top-0 h-36" />
        </div>
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-8 pt-28">
          <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold hero-text-shadow">
            {t("hero.eyebrow")}
          </p>
          <h1 className="max-w-[13ch] text-balance hero-text-shadow">{t("hero.h1")}</h1>
          <p className="mt-5 max-w-[56ch] text-[1.08rem] leading-relaxed text-white/90 hero-text-shadow">
            {t("hero.lead")}
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-8 z-[5] hidden px-6 md:block">
          <div className="mx-auto max-w-[1180px]">
            <AvailBar />
          </div>
        </div>
      </section>

      <section className="bg-surface-2 px-6 pb-8 pt-6 md:hidden">
        <AvailBar showNote={false} />
        <p className="mt-3 text-center text-[0.8rem] font-semibold text-strike">
          {t("avail.note")}
        </p>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-[1180px] items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
              {t("about.eyebrow")}
            </p>
            <h2>{t("about.h2")}</h2>
            <p className="mt-5 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t("about.p")}
            </p>
            <Link
              href="/rooms"
              className="mt-8 inline-flex rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-2"
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
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
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
              className="inline-flex rounded-full border border-ink/25 px-7 py-3.5 text-sm font-bold transition hover:border-brand hover:bg-brand/5"
            >
              {t("rooms.all")}
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-brand px-6 py-24 text-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[620px]">
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
              {t("sys.eyebrow")}
            </p>
            <h2>{t("sys.h2")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-white/80">{t("sys.p")}</p>
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
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gold">
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
            <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
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
                <div className="mb-3 tracking-[3px] text-gold">★★★★★</div>
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
            className="mt-8 inline-flex rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#C29A5E]"
          >
            {t("cta.btn")}
          </Link>
        </div>
      </section>
    </>
  );
}
