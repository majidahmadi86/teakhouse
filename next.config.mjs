import bundleAnalyzer from "@next/bundle-analyzer";
import { writePolicy } from "./lib/writePolicy.mjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * v17 · Preview safety. A Vercel build always knows its environment. VERCEL
 * set without VERCEL_ENV means the build env is not what we think it is, and
 * a guess could make a preview writable against production: stop instead.
 */
if (process.env.VERCEL && !process.env.VERCEL_ENV) {
  throw new Error(
    "next.config.mjs: VERCEL is set but VERCEL_ENV is missing; refusing to " +
      "build or start (preview safety, see lib/writePolicy.mjs)."
  );
}

/**
 * The build's own write decision (lib/writePolicy.mjs: writable only for
 * VERCEL_ENV=production, or off Vercel against a database on localhost),
 * baked into the bundle as a NON-EMPTY literal: "1" read-only, "0" writable.
 * Next inlines only truthy `env` values, so an empty string would not be
 * baked at all. "0" never makes a deployment writable by itself:
 * lib/readOnly.ts re-checks the runtime env, so a writable build served as a
 * preview is still read-only. DB_READ_ONLY=1 in the build env opts a local
 * build in, for the gate (scripts/preview-safety.js).
 */
const DB_READ_ONLY = writePolicy(process.env).writable ? "0" : "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DB_READ_ONLY,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@headlessui/react",
      "date-fns",
      "framer-motion",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  /**
   * Content-hashed static files (their names change when their bytes do) are
   * cached for a year and never revalidated (A1). Only hashed files live under
   * these paths: scripts/fonts/build-fonts.mjs writes /fonts and
   * scripts/images/build-images.mjs writes /img.
   */
  async headers() {
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/fonts/:path*", headers: immutable },
      { source: "/img/:path*", headers: immutable },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/owner", permanent: false },
      { source: "/dashboard/", destination: "/owner", permanent: false },
      // v17 · the boutique rooms became the five-star catalogue; old links
      // land on their nearest room, or on the room list.
      { source: "/rooms/river-loft", destination: "/rooms/premier-river", permanent: true },
      { source: "/rooms/garden-room", destination: "/rooms/deluxe-twin", permanent: true },
      { source: "/rooms/courtyard-twin", destination: "/rooms/deluxe-twin", permanent: true },
      {
        source: "/rooms/:old(pier-studio|mango-corner|captains-cabin|family-annex|attic-nook|poolside-hide)",
        destination: "/rooms",
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
