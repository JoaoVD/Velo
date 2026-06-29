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
