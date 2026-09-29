import type { HotelConfig } from "../types";

const u = (id: string) => `https://images.unsplash.com/${id}`;

/**
 * Minimal zen preset.
 * NOTE: `th` strings below are English placeholders · request Thai from Claude before bilingual ship.
 */
export const config: HotelConfig = {
  id: "minimal-zen",
  name: "Quiet House",
  nameDisplay: "QUIET HOUSE",
  tagline: {
    en: "Minimal Stay · Chiang Mai",
    th: "Minimal Stay · Chiang Mai",
  },
  logoPath: "/favicon.svg",
  siteUrl: "https://quiethouse.demo",
  palette: {
    white: "#FAFAF8",
    cloud: "#F2F2EE",
    ink: "#1C1C1A",
    sub: "#6A6A64",
    navy: "#2A2A28",
    blue: "#4A5D4E",
    blueDark: "#3A4A3E",
    sky: "#E8EDE9",
    coral: "#8B7355",
    coralDeep: "#6F5A42",
    coralBg: "#F3EEE8",
    gold: "#A89070",
    deal: "#4A5D4E",
    dealBg: "#E8EDE9",
    strike: "#9A9A94",
    line: "#E0E0DA",
    brand: "#1C1C1A",
    brand2: "#121210",
    ownBlue: "#7A8F7E",
  },
  fonts: {
    display: "Marcellus",
    sans: "Plus Jakarta Sans",
    thDisplay: "Kanit",
    thBody: "Sarabun",
  },
  photos: {
    hero: [
      u("photo-1600210492486-724fe5c67fb0"),
      u("photo-1600607687939-ce8a6c25118c"),
      u("photo-1600566753190-17f0baa2a6c3"),
    ],
    gallery: [
      u("photo-1616594039964-ae9021a400a0"),
      u("photo-1586023492125-27b2c045efd7"),
      u("photo-1590490359683-658d3d23f972"),
    ],
    about: u("photo-1600210492486-724fe5c67fb0"),
  },
  currencies: ["THB", "USD", "EUR"],
  languages: ["en", "th"],
  contact: {
    email: "stay@quiethouse.demo",
    phone: "+66 53 000 111",
    line: "@quiethouse",
    address: {
      en: "18 Nimmanhaemin Rd, Suthep, Chiang Mai 50200",
      th: "18 Nimmanhaemin Rd, Suthep, Chiang Mai 50200",
    },
    addressShort: {
      en: "Nimman, Chiang Mai",
      th: "Nimman, Chiang Mai",
    },
  },
  map: { lat: 18.7961, lng: 98.9678, zoom: 15 },
  policies: {
    checkIn: "14:00",
    checkOut: "11:00",
    cancel: {
      en: "Free cancellation up to 5 days before arrival.",
      th: "Free cancellation up to 5 days before arrival.",
    },
    pets: {
      en: "Pets are not accommodated.",
      th: "Pets are not accommodated.",
    },
    depositPct: 25,
  },
  concierge: {
    name: { en: "Quiet House Desk", th: "Quiet House Desk" },
    hello: {
      en: "Welcome to Quiet House. Ask about rooms, rates, or the walk to Nimman.",
      th: "Welcome to Quiet House. Ask about rooms, rates, or the walk to Nimman.",
    },
    fallback: {
      en: "I have noted that for the hosts. They reply on LINE (@quiethouse) soon. Rates or directions in the meantime?",
      th: "I have noted that for the hosts. They reply on LINE (@quiethouse) soon. Rates or directions in the meantime?",
    },
    facts: [
      {
        en: "Eight minimal rooms in Nimman, Chiang Mai. Quiet courtyard, no pool noise.",
        th: "Eight minimal rooms in Nimman, Chiang Mai. Quiet courtyard, no pool noise.",
      },
      {
        en: "Check-in from 14:00, check-out by 11:00.",
        th: "Check-in from 14:00, check-out by 11:00.",
      },
    ],
  },
  metadata: {
    title: "Quiet House · Minimal Stay Chiang Mai · Demo by Mikaro Studio",
    description:
      "Minimal zen direct-booking demo: live availability, AI concierge, and owner dashboard.",
  },
};
