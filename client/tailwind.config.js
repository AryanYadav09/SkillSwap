/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: "#f9fafb", // slate-50
        charcoal: "#ffffff", // white
        surface: "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#464555",
        "outline": "#777587",
        "outline-variant": "#c7c4d8",
        primary: {
          DEFAULT: "#3525cd",
          container: "#4f46e5",
          fixed: "#e2dfff",
          "fixed-dim": "#c3c0ff",
        },
        "primary-container": "#4f46e5",
        "primary-fixed": "#e2dfff",
        "on-primary": "#ffffff",
        "on-primary-container": "#dad7ff",
        secondary: {
          DEFAULT: "#00687a",
          container: "#57dffe",
          fixed: "#acedff",
        },
        "secondary-container": "#57dffe",
        "secondary-fixed": "#acedff",
        tertiary: {
          DEFAULT: "#005338",
          container: "#006e4b",
          fixed: "#6ffbbe",
          "fixed-dim": "#4edea3",
        },
        "tertiary-container": "#006e4b",
        "tertiary-fixed": "#6ffbbe",
        "tertiary-fixed-dim": "#4edea3",
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
        glow: "0 0 15px rgba(79, 70, 229, 0.25)",
        "glow-lg": "0 0 25px rgba(79, 70, 229, 0.4)",
        card: "0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)",
        "card-hover": "0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "Segoe UI", "sans-serif"],
        display: ["Plus Jakarta Sans", "Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
