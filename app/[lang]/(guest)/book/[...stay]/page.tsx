import { notFound } from "next/navigation";
import BookPageClient from "../BookPageClient";
import { roomCoverMedia } from "@/lib/roomMedia";
import { stayFromSegments } from "@/lib/stayDate";
import type { LangParams } from "@/lib/pageLocale";

/**
 * /book · the stay is read on the SERVER. The middleware turns the public
 * /book?in&out&g&room (the booking bar's GET form, a room page) into
 * /<lang>/book/<in>/<out>/<g>[/<room>], validated by lib/stayDate, and computes
 * tomorrow on the hotel's clock when there is no stay. So the server HTML shows
 * the guest's own dates and nothing changes when the flow hydrates, while the
 * page stays static: each stay renders once and is cached (ISR).
 */
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

export default function BookPage({ params }: { params: LangParams & { stay: string[] } }) {
  const stay = stayFromSegments(params.stay);
  if (!stay) notFound();
  return <BookPageClient initialStay={stay} media={roomCoverMedia(1080)} />;
}
