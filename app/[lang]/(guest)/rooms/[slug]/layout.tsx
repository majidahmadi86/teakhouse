import type { Metadata } from "next";
import { buildMetadata, ROOM_META_FALLBACK } from "@/lib/routeMeta";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { translateEntry } from "@/lib/i18n-core";
import { SEED_ROOMS } from "@/lib/rooms";
import { ChromeMark } from "@/components/site/PageMarks";

type Props = { params: LangParams & { slug: string } };

/**
 * Room pages take their title and description from the room itself, in the
 * request's language · the catalogue (lib/rooms.ts) carries both, Thai room
 * names included ("ดีลักซ์ คิง").
 */
export function generateMetadata({ params }: Props): Metadata {
  const locale = pageLang(params);
  const room = SEED_ROOMS.find((r) => r.slug === params.slug);
  const name = room ? translateEntry(locale, room.name) : "Room";
  const raw = translateEntry(locale, room?.description ?? ROOM_META_FALLBACK);
  // Keep descriptions inside the ~160 characters a search result shows. Thai
  // has no spaces to break on, so cut on length and let the ellipsis do the
  // work rather than hunting for a word boundary that may not exist.
  const description = raw.length < 160 ? raw : `${raw.slice(0, 157)}…`;

  return buildMetadata(locale, `/rooms/${params.slug}`, {
    title: name,
    description,
    // No openGraph override here · buildMetadata already builds it from the
    // title and description below, and repeating it would drop type/siteName.
  });
}

/** Room pages carry their own booking bar and a white ground. */
export default function RoomSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ChromeMark noBookBar noStayBar flushMain whiteMain />
      {children}
    </>
  );
}
