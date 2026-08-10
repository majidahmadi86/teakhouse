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
  currencies: Array<"THB" | "USD" | "EUR">;
  languages: Array<"en" | "th">;
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
  strike: "#9AA4B2",
  line: "#E3E8EF",
  brand: "#0A1B2E",
  brand2: "#071421",
  ownBlue: "#4D9FFF",
};
