import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";

function SearchCta() {
  return (
    <Link
      href="/book"
      prefetch={false}
      className="flex h-14 w-full items-center justify-center rounded-full bg-white text-[15px] font-bold text-navy shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:max-w-[720px] md:text-[17px]"
    >
      Check rates
    </Link>
  );
}

/** Server page: preload + RSC hero · zero client JS required for LCP. */
export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-640.avif"
        type="image/avif"
        {...{ fetchPriority: "high" }}
      />
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-1920.avif"
        type="image/avif"
        media="(min-width: 769px)"
      />
      <HomeHero searchSlot={<SearchCta />} />
    </>
  );
}
