"use client";

import { Plane, Ship, Train } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useI18n } from "@/lib/i18n";

const DIRECTIONS = [
  { icon: Train, title: "lc.1h", body: "lc.1p" },
  { icon: Ship, title: "lc.2h", body: "lc.2p" },
  { icon: Plane, title: "lc.3h", body: "lc.3p" },
] as const;

const MAP_EMBED =
  "https://www.google.com/maps?q=Charoenkrung+44,+Bang+Rak,+Bangkok&output=embed";
const MAP_ROUTE =
  "https://maps.google.com/?q=Charoenkrung+44+Bang+Rak+Bangkok";

export default function LocationPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a"
        alt="Old Bangkok riverside"
        eyebrow={t("nav.location")}
        title={t("lc.h1")}
        lead={t("lc.lead")}
      />

      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="overflow-hidden rounded-2xl border-2 border-blue shadow-panel">
            <iframe
              title="The Teak House on Google Maps"
              src={MAP_EMBED}
              className="h-[460px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="rounded-[14px] bg-white p-8 shadow-panel">
            <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-blue">
              {t("lc.dir")}
            </p>
            <h2 className="mb-6 text-2xl">{t("lc.h1")}</h2>
            <div className="space-y-6">
              {DIRECTIONS.map(({ icon: Icon, title, body }) => (
                <article key={title} className="flex gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-deal-bg text-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg">{t(title)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/85">{t(body)}</p>
                  </div>
                </article>
              ))}
            </div>
            <article className="mt-6 border-t border-line pt-6">
              <h3 className="font-display text-lg">{t("lc.4h")}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink/85">{t("lc.4p")}</p>
            </article>
            <a
              href={MAP_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex rounded-full bg-navy px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark"
            >
              {t("lc.route")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
