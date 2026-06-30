import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:     "#0f1923",
        navy:    "#1a3a5c",
        signal:  "#c8460a",
        ice:     "#e8f0f7",
        bone:    "#f5f2eb",
        confirm: "#2d6a4f",
        moss: {
          50:  "#eef4f1",
          100: "#d4e8dc",
          200: "#a8c9b7",
          600: "#3f6b4e",
          700: "#2d5a3a",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
