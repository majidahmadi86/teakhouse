import { hotelConfig } from "@/config/hotel.config";
import { DemoModeBar } from "@/components/DemoModeBar";
import { Providers } from "@/components/providers";
import { paletteStyleString } from "@/lib/paletteCss";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import {
  Kanit,
  Marcellus,
  Plus_Jakarta_Sans,
  Sarabun,
} from "next/font/google";
import type { Metadata } from "next";

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
  weight: ["400", "500", "700"],
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: hotelConfig.metadata.title,
    template: `%s · ${hotelConfig.name}`,
  },
  description: hotelConfig.metadata.description,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_TH",
    url: SITE_URL,
    siteName: hotelConfig.name,
    title: hotelConfig.metadata.title,
    description: hotelConfig.metadata.description,
  },
  icons: {
    icon: hotelConfig.logoPath,
    apple: "/apple-touch-icon.png",
  },
};

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const paletteStyle = paletteStyleString(hotelConfig.palette);

  return (
    <html
      lang="en"
      data-demo={DEMO_MODE ? "true" : undefined}
      className={`${marcellus.variable} ${jakarta.variable} ${kanit.variable} ${sarabun.variable}`}
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
      <body className="font-sans antialiased">
        <Providers>
          <DemoModeBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
