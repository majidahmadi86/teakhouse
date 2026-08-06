import type { Metadata } from "next";
import { SEED_ROOMS } from "@/lib/rooms";

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const room = SEED_ROOMS.find((r) => r.slug === params.slug);
  const name = room?.name.en ?? "Room";
  const desc =
    room?.description.en.slice(0, 155) ??
    "Boutique teak room at The Teak House, Bangkok riverside demo hotel.";
  return {
    title: name,
    description: desc.length < 160 ? desc : `${desc.slice(0, 157)}…`,
    alternates: { canonical: `/rooms/${params.slug}` },
  };
}

export default function RoomSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
