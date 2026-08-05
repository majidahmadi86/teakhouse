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
        surface: "#FFFFFF",
        "surface-2": "#FAF8F4",
        ink: "#17211D",
        brand: "#14342B",
        "brand-2": "#0E2620",
        gold: "#B9853D",
        deal: "#1E7B4D",
        "deal-bg": "#E8F5EE",
        strike: "#97A29C",
        line: "#E7E3DA",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-manrope)", "sans-serif"],
        "th-display": ["var(--font-prompt)", "sans-serif"],
        "th-body": ["var(--font-ibm-thai)", "sans-serif"],
      },
      boxShadow: {
        nav: "0 1px 0 rgba(23,33,29,.06), 0 8px 24px rgba(23,33,29,.06)",
        panel: "0 18px 50px rgba(14,38,32,.12)",
      },
    },
  },
  plugins: [],
};
export default config;
