import type { Metadata } from "next";
import { GuestShell } from "./GuestShell";

export const metadata: Metadata = {
  title: {
    default:
      "The Teak House · Riverside Boutique Hotel Bangkok · Demo by Mikaro Studio",
    template: "%s · The Teak House",
  },
  description:
    "Direct-booking demo hotel: live availability with deposits, 24/7 bilingual AI concierge, and an owner dashboard. A showcase system by Mikaro Studio, Bangkok.",
  alternates: {
    canonical: "/",
  },
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestShell>{children}</GuestShell>;
}
