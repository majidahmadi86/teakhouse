/**
 * v15 · Bespoke stay packages · pure, client-safe.
 *
 * A package prices per stay, per night or per person. The selection a guest
 * makes is `[{ key, qty }]`; qty is the number of times a per-stay package is
 * taken (two airport transfers, say) and is ignored for per-night pricing.
 */

export type AddonUnit = "stay" | "night" | "person";
export type AddonCategory = "transfer" | "dining" | "wellness" | "experience" | "family";

export type Addon = {
  id: string;
  key: string;
  name: { en: string; th: string };
  description: { en: string; th: string };
  category: AddonCategory;
  price: number;
  unit: AddonUnit;
  image: string;
  order: number;
  published: boolean;
};

export type AddonSelection = { key: string; qty: number };

export type AddonLine = {
  key: string;
  name: { en: string; th: string };
  unit: AddonUnit;
  price: number;
  qty: number;
  /** nights or guests the unit multiplied by · 1 for per-stay */
  factor: number;
  total: number;
};

export function isAddonUnit(v: unknown): v is AddonUnit {
  return v === "stay" || v === "night" || v === "person";
}

export function isAddonCategory(v: unknown): v is AddonCategory {
  return (
    v === "transfer" ||
    v === "dining" ||
    v === "wellness" ||
    v === "experience" ||
    v === "family"
  );
}

export function addonToClient(row: {
  id: string;
  key: string;
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  descriptionTh: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  order: number;
  published: boolean;
}): Addon {
  return {
    id: row.id,
    key: row.key,
    name: { en: row.nameEn, th: row.nameTh },
    description: { en: row.descriptionEn, th: row.descriptionTh },
    category: isAddonCategory(row.category) ? row.category : "experience",
    price: row.price,
    unit: isAddonUnit(row.unit) ? row.unit : "stay",
    image: row.image,
    order: row.order,
    published: row.published,
  };
}

/** Normalise whatever a client posted into a clean selection. */
export function normaliseSelection(raw: unknown): AddonSelection[] {
  if (!Array.isArray(raw)) return [];
  const out: AddonSelection[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const key = (item as { key?: unknown }).key;
    const qtyRaw = (item as { qty?: unknown }).qty;
    if (typeof key !== "string" || !key || seen.has(key)) continue;
    const qty = Math.max(1, Math.min(10, Math.floor(Number(qtyRaw ?? 1)) || 1));
    seen.add(key);
    out.push({ key, qty });
  }
  return out;
}

export function priceAddons(
  catalogue: readonly Addon[],
  selection: readonly AddonSelection[],
  nights: number,
  guests: number
): { lines: AddonLine[]; total: number } {
  const lines: AddonLine[] = [];
  for (const pick of selection) {
    const addon = catalogue.find((a) => a.key === pick.key && a.published);
    if (!addon) continue;
    const factor =
      addon.unit === "night" ? Math.max(1, nights) : addon.unit === "person" ? Math.max(1, guests) : 1;
    const qty = addon.unit === "stay" ? pick.qty : 1;
    const total = Math.round(addon.price * factor * qty);
    lines.push({
      key: addon.key,
      name: addon.name,
      unit: addon.unit,
      price: addon.price,
      qty,
      factor,
      total,
    });
  }
  return { lines, total: lines.reduce((s, l) => s + l.total, 0) };
}
