import HomeClient from "./HomeClient";

/** Server page: preload same-origin AVIF LCP hero before client JS. */
export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-828.avif"
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
      <HomeClient />
    </>
  );
}
