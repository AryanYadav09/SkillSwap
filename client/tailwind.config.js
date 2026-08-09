/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: "#f9fafb", // slate-50
        charcoal: "#ffffff", // white
        surface: "#f3f4f6",  // gray-100
        gold: {
          50: '#fbf8eb',
          100: '#f6eed2',
          200: '#efdfa9',
          300: '#e5c977',
          400: '#dcaf4b',
          500: '#d4962b',
          600: '#bb7420',
          700: '#9b561e',
          800: '#80441d',
          900: '#6a381a',
          950: '#3e1d0c',
        },
        muted: "#6b7280", // gray-500
        line: "#e5e7eb", // gray-200
      },
      boxShadow: {
        soft: "0 16px 40px rgba(0, 0, 0, 0.4)",
        glow: "0 0 15px rgba(212, 150, 43, 0.2)",
        "glow-lg": "0 0 25px rgba(212, 150, 43, 0.4)",
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "Segoe UI", "sans-serif"],
        display: ["Outfit", "Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
