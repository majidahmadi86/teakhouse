import type { Metadata } from "next";
import { hotelConfig } from "@/config/hotel.config";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { OwnerProviders } from "@/components/OwnerProviders";
import { getDemoStrings } from "@/lib/demoStrings";
import { FontHead, fontSetName } from "@/lib/fonts";
import { paletteStyleString } from "@/lib/paletteCss";
import { getOwnerLocale, t } from "@/lib/serverLocale";
import { SITE_URL } from "@/lib/site";
import { OwnerShell } from "./OwnerShell";
import "../globals.css";

/**
 * The owner panel's ROOT layout. Since v17 the guest pages have their own
 * root under the internal locale segment (app/[lang]/layout.tsx), so the
 * panel carries the document shell it used to inherit: the same fonts,
 * palette and stylesheet. Everything else is unchanged: it renders per
 * request, reads the language cookie (EN or TH, the panel's two languages),
 * and keeps its own providers.
 */
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: `${t(getOwnerLocale(), "db.owner")} · ${hotelConfig.name}`,
    robots: { index: false, follow: false },
    alternates: { canonical: "/owner" },
    icons: {
      icon: hotelConfig.logoPath,
      apple: "/apple-touch-icon.png",
    },
  };
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getOwnerLocale();
  const paletteStyle = paletteStyleString(hotelConfig.palette);
  return (
    <html lang={locale} data-demo={DEMO_MODE ? "true" : undefined} data-script={fontSetName(locale)}>
      <head>
        <FontHead lang={locale} />
        <style dangerouslySetInnerHTML={{ __html: `:root{${paletteStyle}}` }} />
      </head>
      <body className="font-sans antialiased">
        <OwnerProviders initialLang={locale}>
          <DemoModeBar variant="owner" locale={locale} />
          <DemoModal strings={getDemoStrings(locale)}>
            <OwnerStoreProvider scope="owner">
              <OwnerShell>{children}</OwnerShell>
            </OwnerStoreProvider>
          </DemoModal>
        </OwnerProviders>
      </body>
    </html>
  );
}
