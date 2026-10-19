"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, Search } from "lucide-react";
import { GUIDES, GuideBody, guideSteps, type GuidePage } from "@/components/owner/OwnerHelp";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * v18 · The owner help centre. Everything here is static copy in
 * lib/i18n-dict.ts (EN and TH): the nine page guides (ow.guide.*), a short
 * glossary (ow.gl.*) and the order to set the house up in during the first
 * week (ow.fw.*). One search box filters all three.
 */
const GLOSSARY: { id: string; abbr?: string }[] = [
  { id: "adr", abbr: "ADR" },
  { id: "revpar", abbr: "RevPAR" },
  { id: "occupancy" },
  { id: "deposit" },
  { id: "ota", abbr: "OTA" },
];

const FIRST_WEEK: { n: number; href: string }[] = [
  { n: 1, href: "/owner/rooms" },
  { n: 2, href: "/owner/rates" },
  { n: 3, href: "/owner/calendar" },
  { n: 4, href: "/owner/dining" },
  { n: 5, href: "/owner/settings" },
];

export default function OwnerHelpClient() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<GuidePage | null>(null);
  const q = query.trim().toLowerCase();

  const guides = useMemo(() => {
    return GUIDES.filter(({ page }) => {
      if (!q) return true;
      const text = [
        t(`ow.guide.${page}.title`),
        t(`ow.guide.${page}.what`),
        t(`ow.guide.${page}.mistake`),
        ...Array.from({ length: guideSteps(page) }, (_, i) => t(`ow.guide.${page}.s${i + 1}`)),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [q, t]);

  const glossary = useMemo(
    () =>
      GLOSSARY.filter(({ id, abbr }) => {
        if (!q) return true;
        return `${abbr ?? ""} ${t(`ow.gl.${id}.name`)} ${t(`ow.gl.${id}.def`)}`.toLowerCase().includes(q);
      }),
    [q, t]
  );

  const firstWeekMatches =
    !q ||
    [t("ow.fw.title"), t("ow.fw.lead"), ...FIRST_WEEK.map((s) => t(`ow.fw.s${s.n}`))]
      .join(" ")
      .toLowerCase()
      .includes(q);

  const nothing = guides.length === 0 && glossary.length === 0 && !firstWeekMatches;

  return (
    <div>
      <header className="mb-8">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
          {t("ow.ownerEyebrow")}
        </p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
          {t("ow.help.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">
          {t("ow.help.lead")}
        </p>
      </header>

      <div className="owner-panel mb-8 rounded-2xl p-4">
        <label className="relative block">
          <span className="sr-only">{t("ow.help.search")}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ow.help.search")}
            className="min-h-[44px] w-full py-3 pl-11 pr-4 text-base"
          />
        </label>
      </div>

      {nothing ? (
        <p className="py-10 text-center font-semibold text-white/60">{t("ow.help.noMatch")}</p>
      ) : null}

      {firstWeekMatches ? (
        <section className="owner-panel mb-8 rounded-2xl p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-white">{t("ow.fw.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{t("ow.fw.lead")}</p>
          <ol className="mt-6 space-y-3">
            {FIRST_WEEK.map((step) => (
              <li key={step.n}>
                <Link
                  href={step.href}
                  className="owner-inset flex min-h-[52px] items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-own-blue/20 text-sm font-extrabold text-own-blue">
                    {step.n}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed text-white/85">{t(`ow.fw.s${step.n}`)}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {guides.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-white">
            <BookOpen className="h-5 w-5 text-own-blue" aria-hidden />
            {t("ow.help.guides")}
          </h2>
          <ul className="space-y-3">
            {guides.map(({ page, href }) => {
              const isOpen = open === page || (q.length > 0 && guides.length <= 2);
              return (
                <li key={page} className="owner-panel overflow-hidden rounded-2xl">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((p) => (p === page ? null : page))}
                    className="flex min-h-[56px] w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <span className="flex-1">
                      <span className="block font-display text-lg font-semibold text-white">
                        {t(`ow.guide.${page}.title`)}
                      </span>
                      {!isOpen ? (
                        <span className="mt-1 block text-sm text-white/55">{t(`ow.guide.${page}.what`)}</span>
                      ) : null}
                    </span>
                    <ChevronDown
                      className={cn("h-5 w-5 shrink-0 text-white/50 transition", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <div className="owner-split-t px-5 pb-5 pt-5">
                      <GuideBody page={page} />
                      <Link
                        href={href}
                        className="owner-control mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-bold text-white"
                      >
                        {t("ow.help.goTo", { page: t(`ow.guide.${page}.title`) })}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {glossary.length > 0 ? (
        <section className="owner-panel rounded-2xl p-6 md:p-8">
          <h2 className="mb-5 font-display text-xl font-semibold text-white">{t("ow.help.glossary")}</h2>
          <dl className="space-y-5">
            {glossary.map(({ id, abbr }) => (
              <div key={id}>
                <dt className="flex flex-wrap items-baseline gap-2 text-sm font-extrabold text-white">
                  {abbr ? (
                    <span className="rounded-md bg-own-blue/20 px-2 py-0.5 text-xs tracking-wide text-own-blue">
                      {abbr}
                    </span>
                  ) : null}
                  {t(`ow.gl.${id}.name`)}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-white/70">{t(`ow.gl.${id}.def`)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
