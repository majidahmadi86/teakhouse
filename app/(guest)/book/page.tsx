import BookPageClient from "./BookPageClient";
import { parseStay } from "@/lib/stayDate";

type SearchParams = { in?: string; out?: string; g?: string; room?: string };

/**
 * /book · the stay is read on the SERVER (in, out, g, room from the booking
 * bar's GET form or a room page), validated by lib/stayDate, and handed to the
 * flow as its initial state. The server HTML therefore shows the guest's own
 * dates, and nothing changes when the flow hydrates (it used to apply the URL
 * in a useEffect, behind a Suspense fallback).
 */
export default function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const stay = parseStay(searchParams);
  return <BookPageClient initialStay={stay} />;
}
