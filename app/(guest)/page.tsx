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
        imageSrcSet="/hero-lcp-640.avif 640w, /hero-lcp-1920.avif 1920w"
        imageSizes="100vw"
        {...{ fetchPriority: "high" }}
      />
      <HomeClient heroLcp={<HeroLCP />} />
    </>
  );
}
