import HomeClient from "./HomeClient";
import { HeroLCP } from "@/components/hero/HeroLCP";

/** Server page: preload + server-rendered LCP image (no client JS required to paint). */
export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-640.avif"
        type="image/avif"
        media="(max-width: 768px)"
        {...{ fetchPriority: "high" }}
      />
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-1920.avif"
        type="image/avif"
        media="(min-width: 769px)"
        {...{ fetchPriority: "high" }}
      />
      <HomeClient heroLcp={<HeroLCP />} />
    </>
  );
}
