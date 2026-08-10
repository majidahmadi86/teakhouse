import { hotelConfig } from "@/config/hotel.config";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? hotelConfig.siteUrl;

export const SITE_NAME = hotelConfig.name;

export { hotelConfig };
