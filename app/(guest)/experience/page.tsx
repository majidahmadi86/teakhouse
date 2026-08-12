import Link from "next/link";
import { HouseAndTeam } from "@/components/HouseAndTeam";
import { getServerLocale, t } from "@/lib/serverLocale";
import ExperienceClient from "./ExperienceClient";

/**
 * Experience · the animated story sections stay client-side, while House & team
 * and the closing call to action are server-rendered static HTML underneath
 * them, so the house story, the team, and the booking link are all readable
 * with JS disabled.
 */
export default function ExperiencePage() {
  const locale = getServerLocale();

  return (
    <>
      <ExperienceClient />
      <HouseAndTeam locale={locale} />

      <section className="bg-cloud px-6 py-16 text-center">
        <h2>{t(locale, "cta.h2")}</h2>
        <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
          {t(locale, "cta.p")}
        </p>
        <Link href="/book" className="btn-primary mt-8 inline-flex">
          {t(locale, "xp.cta")}
        </Link>
      </section>
    </>
  );
}
