import type { Metadata } from "next";
import {
  Kanit,
  Marcellus,
  Plus_Jakarta_Sans,
  Sarabun,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

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
  title: "The Teak House",
  description:
    "Twelve teak rooms on the Chao Phraya. Book direct and always pay less than on any booking site.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${marcellus.variable} ${jakarta.variable} ${kanit.variable} ${sarabun.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
