import { Kanit, Marcellus, Plus_Jakarta_Sans, Sarabun } from "next/font/google";

/**
 * The house typefaces · declared once and shared by the guest root layout
 * (app/[lang]/layout.tsx) and the owner panel's (app/owner/layout.tsx).
 */
const marcellus = Marcellus({
  subsets: ["latin"],
  variable: "--font-marcellus",
  display: "swap",
  weight: ["400"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "700"],
  preload: false,
});

const kanit = Kanit({
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
  display: "swap",
  weight: ["500", "600"],
  preload: false,
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
  weight: ["400", "600"],
  preload: false,
});

export const fontVariables = `${marcellus.variable} ${jakarta.variable} ${kanit.variable} ${sarabun.variable}`;
