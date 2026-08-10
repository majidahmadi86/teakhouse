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
        white: "var(--color-white, #FFFFFF)",
        cloud: "var(--color-cloud, #F4F7FB)",
        ink: "var(--color-ink, #17212E)",
        sub: "var(--color-sub, #5E6B7E)",
        navy: "var(--color-navy, #0A2E5C)",
        blue: "var(--color-blue, #0A6CDE)",
        "blue-dark": "var(--color-blue-dark, #0857BE)",
        sky: "var(--color-sky, #E9F2FE)",
        coral: "var(--color-coral, #FF6B4A)",
        "coral-deep": "var(--color-coral-deep, #E14F2E)",
        "coral-bg": "var(--color-coral-bg, #FFF0EC)",
        gold: "var(--color-gold, #E8A93D)",
        deal: "var(--color-deal, #067647)",
        "deal-bg": "var(--color-deal-bg, #E6F4EE)",
        strike: "var(--color-strike, #9AA4B2)",
        line: "var(--color-line, #E3E8EF)",
        // Owner navy family
        brand: "var(--color-brand, #0A1B2E)",
        "brand-2": "var(--color-brand-2, #071421)",
        "own-blue": "var(--color-own-blue, #4D9FFF)",
        surface: "#FFFFFF",
        "surface-2": "#F4F7FB",
      },
      fontFamily: {
        display: ["var(--font-marcellus)", "serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
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
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
