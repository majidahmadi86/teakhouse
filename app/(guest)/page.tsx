import { HomeHero } from "@/components/home/HomeHero";
import {
  DeferredSearchPill,
  HomeDeferredIslands,
} from "@/components/home/HomeDeferredIslands";
import { HomeHeroThaiGate } from "@/components/home/HomeHeroThaiGate";

/** Server page: preload + RSC hero · client islands deferred past LCP. */
export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-640.avif"
        type="image/avif"
        media="(max-width: 640px)"
        {...{ fetchPriority: "high" }}
      />
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-828.avif"
        type="image/avif"
        media="(min-width: 641px) and (max-width: 768px)"
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
      <HomeHero searchSlot={<DeferredSearchPill />} />
      <HomeHeroThaiGate />
      <HomeDeferredIslands />
    </>
  );
}
