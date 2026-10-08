import { hotelConfig } from "@/config/hotel.config";
import { paletteStyleString } from "@/lib/paletteCss";
import { FontHead, fontSetName } from "@/lib/fonts";
import { translateEntry } from "@/lib/i18n-core";
import { langMeta } from "@/lib/locales/meta";
import { langStaticParams, pageLang, type LangParams } from "@/lib/pageLocale";
import { STAY_CORE_JS, STAY_NOSCRIPT_CSS } from "@/lib/staySearchScript";
import { UNVEIL_JS } from "@/lib/unveilScript";
import { ROUTE_META } from "@/lib/routeMeta";
import { SITE_URL } from "@/lib/site";
import "../globals.css";
import type { Metadata } from "next";

/**
 * The guest root layout · one per language, prerendered.
 *
 * Every guest page lives under this internal [lang] segment: the middleware
 * resolves the language (?lang > cookie > Accept-Language) and rewrites the
 * public URL here, so /rooms in Thai is the static page /th/rooms while the
 * address bar keeps /rooms. Nothing under this layout may read cookies() or
 * headers(): the language is the route, and every page is static or ISR
 * (scripts/static-routes.js holds that line on every build).
 *
 * Unknown languages are a 404 here (not `dynamicParams = false`, which would
 * also forbid the on-demand children: /book's stays, the form confirmations).
 */
export function generateStaticParams() {
  return langStaticParams();
}

/**
 * The site-wide defaults in the page's language · a Thai page shared to a chat
 * produces a Thai preview card. Route segments override title and description
 * through routeMetadata(); this is what a route without its own copy uses.
 */
export function generateMetadata({ params }: { params: LangParams }): Metadata {
  const locale = pageLang(params);
  const home = ROUTE_META["/"];
  const title = translateEntry(locale, home.title);
  const description = translateEntry(locale, home.description!);

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

export default function GuestRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: LangParams;
}>) {
  const paletteStyle = paletteStyleString(hotelConfig.palette);
  const lang = pageLang(params);
  const meta = langMeta(lang);

  return (
    <html
      lang={meta.tag}
      dir={meta.dir}
      data-demo={DEMO_MODE ? "true" : undefined}
      data-script={fontSetName(lang)}
    >
      <head>
        <FontHead lang={lang} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{${paletteStyle}}`,
          }}
        />
        {/* The booking bar's behaviour (lib/staySearchScript.ts) and its
            no-script fallback: the native date inputs show themselves. */}
        <script dangerouslySetInnerHTML={{ __html: STAY_CORE_JS }} />
        {/* The decode-gated unveil for images below the fold (lib/unveilScript). */}
        <script dangerouslySetInnerHTML={{ __html: UNVEIL_JS }} />
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: STAY_NOSCRIPT_CSS }} />
        </noscript>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
