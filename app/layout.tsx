import { hotelConfig } from "@/config/hotel.config";
import { paletteStyleString } from "@/lib/paletteCss";
import { langMeta } from "@/lib/locales";
import { getServerLocale } from "@/lib/serverLocale";
import { ROUTE_META } from "@/lib/routeMeta";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import {
  Cormorant_Garamond,
  Kanit,
  Plus_Jakarta_Sans,
  Sarabun,
} from "next/font/google";
import type { Metadata } from "next";

/**
 * v15 · Cormorant Garamond carries every headline · the serif of the house.
 * Plus Jakarta stays as the quiet sans for interface copy. Thai keeps Kanit
 * and Sarabun. Other scripts (CJK, Arabic, Devanagari, Cyrillic) use the
 * system's own typefaces through the per-language stacks in globals.css, so
 * no language costs a font download.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic", "vietnamese"],
  variable: "--font-marcellus",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "700"],
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

/**
 * The site-wide defaults, in the request's language.
 *
 * A function rather than a constant because the title, the description and the
 * openGraph locale all depend on the cookie · a Thai guest sharing the home
 * page should not produce an English preview card. Every guest route already
 * renders dynamically (they all read the locale cookie), so reading it here
 * costs nothing extra. Route segments override title and description through
 * routeMetadata(); this is what a route without its own copy falls back to.
 */
export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const home = ROUTE_META["/"];
  const title = home.title[locale === "th" ? "th" : "en"];
  const description = home.description![locale === "th" ? "th" : "en"];

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${hotelConfig.name}`,
    },
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: langMeta(locale).og,
      url: SITE_URL,
      siteName: hotelConfig.name,
      title,
      description,
    },
    icons: {
      icon: hotelConfig.logoPath,
      apple: "/apple-touch-icon.png",
    },
  };
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const paletteStyle = paletteStyleString(hotelConfig.palette);
  const locale = getServerLocale();
  const meta = langMeta(locale);

  return (
    <html
      lang={meta.tag}
      dir={meta.dir}
      data-lang={locale}
      data-demo={DEMO_MODE ? "true" : undefined}
      className={`${cormorant.variable} ${jakarta.variable} ${kanit.variable} ${sarabun.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{${paletteStyle}}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
