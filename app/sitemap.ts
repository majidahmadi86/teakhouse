import type { MetadataRoute } from "next";
import { SEED_ROOMS } from "@/lib/rooms";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicRoutes = [
    "",
    "/rooms",
    "/dining",
    "/events",
    "/experience",
    "/facilities",
    "/offers",
    "/gallery",
    "/location",
    "/contact",
    "/book",
  ];

  const pages: MetadataRoute.Sitemap = publicRoutes.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/book" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/rooms" || path === "/book" ? 0.9 : 0.7,
  }));

  const rooms: MetadataRoute.Sitemap = SEED_ROOMS.map((room) => ({
    url: `${SITE_URL}/rooms/${room.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...pages, ...rooms];
}
