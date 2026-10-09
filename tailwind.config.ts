import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // rgb(var(--x-rgb) / <alpha-value>) · lets Tailwind compose text-x/NN,
        // bg-x/NN, border-x/NN, ring-x/NN opacity utilities from the palette.
        white: "rgb(var(--color-white-rgb, 255 255 255) / <alpha-value>)",
        cloud: "rgb(var(--color-cloud-rgb, 244 247 251) / <alpha-value>)",
        ink: "rgb(var(--color-ink-rgb, 23 33 46) / <alpha-value>)",
        sub: "rgb(var(--color-sub-rgb, 94 107 126) / <alpha-value>)",
        navy: "rgb(var(--color-navy-rgb, 10 46 92) / <alpha-value>)",
        blue: "rgb(var(--color-blue-rgb, 10 108 222) / <alpha-value>)",
        "blue-dark": "rgb(var(--color-blue-dark-rgb, 8 87 190) / <alpha-value>)",
        sky: "rgb(var(--color-sky-rgb, 233 242 254) / <alpha-value>)",
        coral: "rgb(var(--color-coral-rgb, 255 107 74) / <alpha-value>)",
        "coral-deep": "rgb(var(--color-coral-deep-rgb, 225 79 46) / <alpha-value>)",
        "coral-bg": "rgb(var(--color-coral-bg-rgb, 255 240 236) / <alpha-value>)",
        gold: "rgb(var(--color-gold-rgb, 232 169 61) / <alpha-value>)",
        deal: "rgb(var(--color-deal-rgb, 6 118 71) / <alpha-value>)",
        "deal-bg": "rgb(var(--color-deal-bg-rgb, 230 244 238) / <alpha-value>)",
        strike: "rgb(var(--color-strike-rgb, 154 164 178) / <alpha-value>)",
        line: "rgb(var(--color-line-rgb, 227 232 239) / <alpha-value>)",
        // Owner navy family
        brand: "rgb(var(--color-brand-rgb, 10 27 46) / <alpha-value>)",
        "brand-2": "rgb(var(--color-brand-2-rgb, 7 20 33) / <alpha-value>)",
        "own-blue": "rgb(var(--color-own-blue-rgb, 77 159 255) / <alpha-value>)",
        // v17 five-star guest tokens · fixed values (no injection needed).
        stone: "rgb(var(--color-stone-rgb, 251 249 245) / <alpha-value>)",
        ivory: "rgb(var(--color-ivory-rgb, 244 239 230) / <alpha-value>)",
        sand: "rgb(var(--color-sand-rgb, 233 225 211) / <alpha-value>)",
        teak: "rgb(var(--color-teak-rgb, 138 90 52) / <alpha-value>)",
        "teak-light": "rgb(var(--color-teak-light-rgb, 196 154 108) / <alpha-value>)",
        river: "rgb(var(--color-river-rgb, 77 107 116) / <alpha-value>)",
        "river-soft": "rgb(var(--color-river-soft-rgb, 232 238 240) / <alpha-value>)",
        forest: "rgb(var(--color-forest-rgb, 30 74 61) / <alpha-value>)",
        "forest-dark": "rgb(var(--color-forest-dark-rgb, 21 58 47) / <alpha-value>)",
        "forest-soft": "rgb(var(--color-forest-soft-rgb, 230 238 232) / <alpha-value>)",
        surface: "#FFFFFF",
        "surface-2": "#F4F7FB",
      },
      fontFamily: {
        // One pair per language, set by lib/fonts.tsx on <html> (the
        // variables below all point at the active pair).
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-text)", "sans-serif"],
        "th-display": ["var(--font-kanit)", "sans-serif"],
        "th-body": ["var(--font-sarabun)", "sans-serif"],
      },
      boxShadow: {
        nav: "0 1px 0 rgba(16,24,40,.06)",
        card: "0 2px 12px rgba(16,24,40,.06)",
        "card-hover": "0 8px 24px rgba(16,24,40,.12)",
        cta: "0 8px 20px rgba(10,108,222,.35)",
        panel: "0 18px 50px rgba(10,46,92,.12)",
        "2xl": "0 25px 50px -12px rgba(16,24,40,.25)",
        soft: "0 1px 2px rgba(42,33,27,.04), 0 12px 32px -14px rgba(42,33,27,.14)",
        lift: "0 2px 6px rgba(42,33,27,.05), 0 28px 56px -20px rgba(42,33,27,.22)",
        dock: "0 -1px 0 rgba(42,33,27,.06), 0 -12px 32px -16px rgba(42,33,27,.18)",
        float: "0 2px 8px rgba(42,33,27,.06), 0 24px 64px -24px rgba(42,33,27,.32)",
      },
      borderRadius: {
        card: "8px",
        soft: "6px",
      },
      maxWidth: {
        site: "1240px",
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
