import type { Metadata } from "next";
import {
  Fraunces,
  IBM_Plex_Sans_Thai,
  Manrope,
  Prompt,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["500", "600"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const prompt = Prompt({
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
  weight: ["400", "500", "600"],
});

const ibmThai = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-ibm-thai",
  display: "swap",
  weight: ["400", "600", "700"],
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
      className={`${fraunces.variable} ${manrope.variable} ${prompt.variable} ${ibmThai.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
