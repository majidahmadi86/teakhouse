import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * v17 · Preview safety. A build made for a Vercel preview is read-only for
 * its whole life: this bakes DB_READ_ONLY="1" into the bundle, so the build
 * refuses writes even if VERCEL_ENV is not exposed at runtime (lib/readOnly.ts).
 * Production and local builds bake "" and stay writable. DB_READ_ONLY=1 in the
 * build env opts a local build in, for the gate (scripts/preview-safety.js).
 */
const DB_READ_ONLY =
  process.env.VERCEL_ENV === "preview" || process.env.DB_READ_ONLY === "1"
    ? "1"
    : "";

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
  async redirects() {
    return [
      { source: "/dashboard", destination: "/owner", permanent: false },
      { source: "/dashboard/", destination: "/owner", permanent: false },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
