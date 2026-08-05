/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

export default nextConfig;
