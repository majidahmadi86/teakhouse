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
        // Guest v3 palette
        white: "#FFFFFF",
        cloud: "#F2F5F9",
        ink: "#1A1A2B",
        sub: "#5E6B7E",
        navy: "#0A2E5C",
        blue: "#0A6CDE",
        "blue-dark": "#0857B4",
        sky: "#E8F1FD",
        amber: "#FFB700",
        orange: "#F2600C",
        deal: "#067647",
        "deal-bg": "#E6F4EE",
        strike: "#9AA4B2",
        line: "#E3E8EF",
        // Owner control-room (unchanged green)
        brand: "#14342B",
        "brand-2": "#0E2620",
        gold: "#B9853D",
        // Aliases
        surface: "#FFFFFF",
        "surface-2": "#F2F5F9",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-manrope)", "sans-serif"],
        "th-display": ["var(--font-prompt)", "sans-serif"],
        "th-body": ["var(--font-ibm-thai)", "sans-serif"],
      },
      boxShadow: {
        nav: "0 1px 0 rgba(16,24,40,.06)",
        card: "0 2px 12px rgba(16,24,40,.06)",
        "card-hover": "0 8px 24px rgba(16,24,40,.12)",
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
