import type { HotelPalette } from "@/config/types";

/** CSS custom properties from hotel palette · inject on <html>. */
export function paletteToCssVars(p: HotelPalette): Record<string, string> {
  return {
    "--color-white": p.white,
    "--color-cloud": p.cloud,
    "--color-ink": p.ink,
    "--color-sub": p.sub,
    "--color-navy": p.navy,
    "--color-blue": p.blue,
    "--color-blue-dark": p.blueDark,
    "--color-sky": p.sky,
    "--color-coral": p.coral,
    "--color-coral-deep": p.coralDeep,
    "--color-coral-bg": p.coralBg,
    "--color-gold": p.gold,
    "--color-deal": p.deal,
    "--color-deal-bg": p.dealBg,
    "--color-strike": p.strike,
    "--color-line": p.line,
    "--color-brand": p.brand,
    "--color-brand-2": p.brand2,
    "--color-own-blue": p.ownBlue,
  };
}

export function paletteStyleString(p: HotelPalette): string {
  return Object.entries(paletteToCssVars(p))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
