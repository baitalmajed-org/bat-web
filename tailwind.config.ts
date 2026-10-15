import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#791A30",
          deep: "#5A1224",
          soft: "#F6E9ED",
          50: "#FBF3F5",
          100: "#F6E9ED",
          200: "#EBCDD5",
          500: "#A3304D",
          600: "#8C2540",
          700: "#791A30",
          800: "#5A1224",
          900: "#3D0C18",
        },
        steel: {
          DEFAULT: "#73777A",
          50: "#F5F5F6",
          100: "#ECEDEE",
          200: "#DADCDD",
          300: "#C0C3C5",
          500: "#73777A",
          600: "#5B5F62",
          700: "#44474A",
          800: "#2D3033",
          900: "#1E2023",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      maxWidth: { page: "80rem" },
      keyframes: { fadeUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } } },
    },
  },
  plugins: [],
};
export default config;
