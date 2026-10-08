import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { DictEntry } from "@/lib/i18n-core";
import type { DiningCategory } from "@/lib/dining";
import type { HotelEvent } from "@/lib/events";
import type { Lang } from "@/lib/locales/meta";

/**
 * Database content in the fourteen languages beyond English and Thai · server
 * only (the v16 layer, ported; its pipeline and translations come in Phase 3).
 *
 * English and Thai keep their paired columns (nameEn/nameTh...). The other
 * languages live in EntityTranslation rows keyed entityType:entityId:field,
 * read once per locale (tag-cached) and folded into the bilingual objects the
 * pages already render: an `{ en, th }` field gains a `[locale]` slot, which
 * translateEntry() prefers. A missing row falls back to English.
 *
 * A row counts only while its sourceHash matches the CURRENT English text
 * (sha256 of the trimmed text, the v16 pipeline's hashSource): the production
 * table still holds v16 translations of copy that has since changed, and a
 * translation of the old wording must never stand in for the new one.
 */

export const TAG_CONTENT = "content-i18n";
const HOUR = 3600;

type Row = { text: string; hash: string };
export type ContentMap = Record<string, Row>;

const readContentMap = unstable_cache(
  async (locale: string): Promise<ContentMap> => {
    const rows = await prisma.entityTranslation.findMany({
      where: { locale },
      select: { entityType: true, entityId: true, field: true, text: true, sourceHash: true },
    });
    const out: ContentMap = {};
    for (const r of rows) out[`${r.entityType}:${r.entityId}:${r.field}`] = { text: r.text, hash: r.sourceHash };
    return out;
  },
  ["content-map-v17"],
  { tags: [TAG_CONTENT], revalidate: HOUR }
);

/**
 * The locale's rows for a STATIC page · throws on a failed read, so Next keeps
 * the last good page instead of baking an all-English fallback into it.
 */
export async function getContentMapForPage(locale: Lang): Promise<ContentMap> {
  if (locale === "en" || locale === "th") return {};
  return readContentMap(locale);
}

export function hashSource(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex").slice(0, 32);
}

function pick(map: ContentMap, key: string, english: string): string | undefined {
  const row = map[key];
  return row && row.hash === hashSource(english) ? row.text : undefined;
}

function withLocale(entry: DictEntry, locale: Lang, text: string | undefined): DictEntry {
  if (!text || locale === "en" || locale === "th") return entry;
  return { ...entry, [locale]: text } as DictEntry;
}

export function localizeMenu(categories: DiningCategory[], locale: Lang, map: ContentMap): DiningCategory[] {
  if (locale === "en" || locale === "th") return categories;
  return categories.map((c) => ({
    ...c,
    name: withLocale(c.name, locale, pick(map, `diningCategory:${c.id}:name`, c.name.en)),
    items: c.items.map((i) => ({
      ...i,
      name: withLocale(i.name, locale, pick(map, `diningItem:${i.id}:name`, i.name.en)),
      description: withLocale(i.description, locale, pick(map, `diningItem:${i.id}:description`, i.description.en)),
    })),
  }));
}

export function localizeEvents(events: HotelEvent[], locale: Lang, map: ContentMap): HotelEvent[] {
  if (locale === "en" || locale === "th") return events;
  return events.map((e) => ({
    ...e,
    title: withLocale(e.title, locale, pick(map, `event:${e.id}:title`, e.title.en)),
    description: withLocale(e.description, locale, pick(map, `event:${e.id}:description`, e.description.en)),
  }));
}
