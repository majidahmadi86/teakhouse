import type { HotelPalette } from "@/config/types";

/** "#0A2E5C" -> "10 46 92" · space-separated channels for rgb(... / <alpha>). */
function hexToRgbChannels(hex: string): string | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const COLOR_KEYS: Array<[string, keyof HotelPalette]> = [
  ["white", "white"],
  ["cloud", "cloud"],
  ["ink", "ink"],
  ["sub", "sub"],
  ["navy", "navy"],
  ["blue", "blue"],
  ["blue-dark", "blueDark"],
  ["sky", "sky"],
  ["coral", "coral"],
  ["coral-deep", "coralDeep"],
  ["coral-bg", "coralBg"],
  ["gold", "gold"],
  ["deal", "deal"],
  ["deal-bg", "dealBg"],
  ["strike", "strike"],
  ["line", "line"],
  ["brand", "brand"],
  ["brand-2", "brand2"],
  ["own-blue", "ownBlue"],
];

/**
 * CSS custom properties from the hotel palette · injected on <html>.
 * Each colour ships as a hex var (`--color-x`, direct use) AND an rgb-channel
 * var (`--color-x-rgb`), so Tailwind can compose `text-x/NN` opacity utilities
 * via rgb(var(--color-x-rgb) / <alpha-value>).
 */
export function paletteToCssVars(p: HotelPalette): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, key] of COLOR_KEYS) {
    const hex = p[key];
    out[`--color-${name}`] = hex;
    const channels = hexToRgbChannels(hex);
    if (channels) out[`--color-${name}-rgb`] = channels;
  }
  return out;
}

export function paletteStyleString(p: HotelPalette): string {
  return Object.entries(paletteToCssVars(p))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
