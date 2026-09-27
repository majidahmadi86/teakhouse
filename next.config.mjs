import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
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
   * v15 · Security headers on every response, and long-lived immutable caching
   * for the fingerprinted static assets. CSP ships Report-Only first: Next's
   * inline hydration scripts need nonces before it can be enforced without
   * breaking the guest pages.
   */
  async headers() {
    const security = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
      {
        key: "Content-Security-Policy-Report-Only",
        value:
          "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.frankfurter.app; frame-ancestors 'self'; form-action 'self' https://checkout.stripe.com https://commerce.coinbase.com",
      },
    ];
    return [
      { source: "/(.*)", headers: security },
      { source: "/owner/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Cache-Control", value: "private, no-store" }] },
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      { source: "/hero-lcp-:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/owner", permanent: false },
      { source: "/dashboard/", destination: "/owner", permanent: false },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
