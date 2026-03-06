import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50:  '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc5c5',
          300: '#ff9a9a',
          400: '#ff5c5c',
          500: '#e8001c',
          600: '#cc0018',
          700: '#a80014',
          800: '#8a0010',
          900: '#6b000c',
        }
      }
    }
  },
  plugins: [],
} satisfies Config;
