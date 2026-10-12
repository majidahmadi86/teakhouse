"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export type NotFoundStrings = {
  eyebrow: string;
  title: string;
  lead: string;
  home: string;
  rooms: string;
};

/**
 * The 404's words in the route's language · the same composition as a
 * PageHero without a photograph (eyebrow, title, lead, rule). See
 * not-found.tsx for why the language is read here.
 */
export function NotFoundCopy({ copy }: { copy: Record<string, NotFoundStrings> }) {
  const params = useParams<{ lang?: string }>();
  const s = (params?.lang && copy[params.lang]) || copy.en;

  return (
    <section className="bg-stone">
      <div className="wrap pb-14 pt-12 md:pb-24 md:pt-20">
        <div className="max-w-[860px]">
          <p className="eyebrow">{s.eyebrow}</p>
          <h1 className="mt-4 md:mt-5">{s.title}</h1>
          <p className="lead mt-5 max-w-[60ch] md:mt-6">{s.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" prefetch={false} className="btn-primary">
              {s.home}
            </Link>
            <Link href="/rooms" prefetch={false} className="btn-secondary">
              {s.rooms}
            </Link>
          </div>
        </div>
        <span className="rule mt-12 md:mt-16" aria-hidden />
      </div>
    </section>
  );
}
