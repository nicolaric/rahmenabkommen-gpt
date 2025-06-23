import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  // darkMode: "media" means it respects the user's OS preference (prefers-color-scheme).
  // darkMode: "class" means dark mode activates when <html> or <body> has class dark.
  darkMode: "class", // respect OS preference  
  theme: {
    extend: {
      colors: {
        gray: {
          925: '#090f1a', // deine neue Zwischenfarbe
        }
      },      
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
