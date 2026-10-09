import type { CurrencyCode } from "../lib/currencies";
import type { Lang } from "../lib/locales/meta";

export type HotelPalette = {
  white: string;
  cloud: string;
  ink: string;
  sub: string;
  navy: string;
  blue: string;
  blueDark: string;
  sky: string;
  coral: string;
  coralDeep: string;
  coralBg: string;
  gold: string;
  deal: string;
  dealBg: string;
  strike: string;
  line: string;
  brand: string;
  brand2: string;
  ownBlue: string;
};

export type HotelFonts = {
  display: string;
  sans: string;
  thDisplay: string;
  thBody: string;
};

export type HotelConfig = {
  id: string;
  name: string;
  nameDisplay: string;
  tagline: { en: string; th: string };
  logoPath: string;
  siteUrl: string;
  palette: HotelPalette;
  fonts: HotelFonts;
  /** Hero / marketing photo URLs */
  photos: {
    hero: string[];
    gallery: string[];
    about: string;
  };
  /** Display currencies, THB first (the base every amount is stored in). */
  currencies: CurrencyCode[];
  /** Guest languages offered in the language menu. */
  languages: Lang[];
  contact: {
    email: string;
    phone: string;
    line: string;
    address: { en: string; th: string };
    addressShort: { en: string; th: string };
  };
  map: { lat: number; lng: number; zoom: number };
  policies: {
    checkIn: string;
    checkOut: string;
    cancel: { en: string; th: string };
    pets: { en: string; th: string };
    depositPct: number;
  };
  concierge: {
    name: { en: string; th: string };
    hello: { en: string; th: string };
    fallback: { en: string; th: string };
    facts: { en: string; th: string }[];
  };
  metadata: {
    title: string;
    description: string;
  };
};

/**
 * The guest site's palette (v17 A4, the five-star evolution) · bright, warm
 * and calm: white stone and warm ivory grounds, deep teak ink for text, a
 * deep tropical green for every primary action, teak accents used sparingly,
 * and a soft river grey-blue for quiet details. Injected by the guest root
 * layout only; the owner panel keeps TEAK_PALETTE below.
 *
 * The legacy token names keep their roles so every guest surface follows at
 * once: `blue` is the primary action (now forest green), `sky` its tint,
 * `navy` the strongest ink, `cloud` the ivory alternate ground, `gold` the
 * teak accent, `coral` a muted terracotta kept for errors only.
 */
export const TEAK_GUEST_PALETTE: HotelPalette = {
  white: "#FFFFFF",
  cloud: "#F4EFE6",
  ink: "#2A211B",
  sub: "#675B51",
  navy: "#2A211B",
  blue: "#1E4A3D",
  blueDark: "#153A2F",
  sky: "#E6EEE8",
  coral: "#B4553B",
  coralDeep: "#9C4530",
  coralBg: "#F7EDE8",
  gold: "#8A5A34",
  deal: "#2C6A4E",
  dealBg: "#E8F1EB",
  strike: "#776C63",
  line: "#E5DDD0",
  brand: "#0A1B2E",
  brand2: "#071421",
  ownBlue: "#4D9FFF",
};

export const TEAK_PALETTE: HotelPalette = {
  white: "#FFFFFF",
  cloud: "#F4F7FB",
  ink: "#17212E",
  sub: "#5E6B7E",
  navy: "#0A2E5C",
  blue: "#0A6CDE",
  blueDark: "#0857BE",
  sky: "#E9F2FE",
  coral: "#FF6B4A",
  coralDeep: "#E14F2E",
  coralBg: "#FFF0EC",
  gold: "#E8A93D",
  deal: "#067647",
  dealBg: "#E6F4EE",
  strike: "#667284",
  line: "#E3E8EF",
  brand: "#0A1B2E",
  brand2: "#071421",
  ownBlue: "#4D9FFF",
};
