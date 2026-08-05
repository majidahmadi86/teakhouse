import { notFound, redirect } from "next/navigation";
import { RoomDetailClient } from "@/components/RoomDetailClient";
import { getRoomByKey, getRoomBySlug, SEED_ROOMS } from "@/lib/rooms";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return SEED_ROOMS.map((room) => ({ slug: room.slug }));
}

export default function RoomDetailPage({ params }: Props) {
  const { slug } = params;
  const bySlug = getRoomBySlug(slug);
  const byKey = getRoomByKey(slug);

  if (!bySlug && !byKey) {
    notFound();
  }

  const room = bySlug ?? byKey!;

  if (room.slug !== slug) {
    redirect(`/rooms/${room.slug}`);
  }

  return <RoomDetailClient room={room} />;
}
