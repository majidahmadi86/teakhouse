import type { HotelConfig } from "../types";

const u = (id: string) => `https://images.unsplash.com/${id}`;

/**
 * City boutique preset.
 * NOTE: `th` strings below are English placeholders · request Thai from Claude before bilingual ship.
 */
export const config: HotelConfig = {
  id: "city-boutique",
  name: "Maison Lane",
  nameDisplay: "MAISON LANE",
  tagline: {
    en: "Design Hotel · Silom",
    th: "Design Hotel · Silom",
  },
  logoPath: "/favicon.svg",
  siteUrl: "https://maisonlane.demo",
  palette: {
    white: "#FFFFFF",
    cloud: "#F7F5F2",
    ink: "#1A1512",
    sub: "#6B5E54",
    navy: "#2C1810",
    blue: "#8B4513",
    blueDark: "#6B3410",
    sky: "#F0E6DC",
    coral: "#C45C26",
    coralDeep: "#A3481C",
    coralBg: "#F8EDE6",
    gold: "#C4A35A",
    deal: "#3D6B4F",
    dealBg: "#E8F0EB",
    strike: "#A89890",
    line: "#E5DDD6",
    brand: "#1A120E",
    brand2: "#120C09",
    ownBlue: "#D4A574",
  },
  fonts: {
    display: "Marcellus",
    sans: "Plus Jakarta Sans",
    thDisplay: "Kanit",
    thBody: "Sarabun",
  },
  photos: {
    hero: [
      u("photo-1520250497591-112f2f40a3f4"),
      u("photo-1551882547-ff40c63fe5fa"),
      u("photo-1564501049412-61c2a3083791"),
    ],
    gallery: [
      u("photo-1618773928121-c32242e63f39"),
      u("photo-1590490360182-c33d57733427"),
      u("photo-1582719508461-905c673771fd"),
    ],
    about: u("photo-1551882547-ff40c63fe5fa"),
  },
  currencies: ["THB", "USD", "EUR"],
  languages: ["en", "th"],
  contact: {
    email: "hello@maisonlane.demo",
    phone: "+66 2 111 2222",
    line: "@maisonlane",
    address: {
      en: "42 Silom Soi 4, Bang Rak, Bangkok 10500",
      th: "42 Silom Soi 4, Bang Rak, Bangkok 10500",
    },
    addressShort: {
      en: "Silom Soi 4, Bangkok",
      th: "Silom Soi 4, Bangkok",
    },
  },
  map: { lat: 13.7262, lng: 100.5235, zoom: 16 },
  policies: {
    checkIn: "15:00",
    checkOut: "11:00",
    cancel: {
      en: "Free cancellation up to 2 days before arrival.",
      th: "Free cancellation up to 2 days before arrival.",
    },
    pets: {
      en: "Pets are not accommodated.",
      th: "Pets are not accommodated.",
    },
    depositPct: 30,
  },
  concierge: {
    name: { en: "Lane Concierge", th: "Lane Concierge" },
    hello: {
      en: "Welcome to Maison Lane. I can help with rates, rooms, and getting here from BTS Sala Daeng.",
      th: "Welcome to Maison Lane. I can help with rates, rooms, and getting here from BTS Sala Daeng.",
    },
    fallback: {
      en: "I have passed that to the front desk. They reply on LINE (@maisonlane) within the hour. Meanwhile, rates or directions?",
      th: "I have passed that to the front desk. They reply on LINE (@maisonlane) within the hour. Meanwhile, rates or directions?",
    },
    facts: [
      {
        en: "Eighteen design rooms on Silom Soi 4, steps from BTS Sala Daeng.",
        th: "Eighteen design rooms on Silom Soi 4, steps from BTS Sala Daeng.",
      },
      {
        en: "Check-in from 15:00, check-out by 11:00.",
        th: "Check-in from 15:00, check-out by 11:00.",
      },
    ],
  },
  metadata: {
    title: "Maison Lane · Design Hotel Silom · Demo by Mikaro Studio",
    description:
      "City boutique direct-booking demo: live availability, AI concierge, and owner dashboard.",
  },
};
