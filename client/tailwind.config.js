/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        muted: "#667085",
        line: "#d7dde5",
        paper: "#f8faf7",
        forest: "#176b5d",
        coral: "#df6b4f",
        sky: "#2f80a8",
        amber: "#b7791f",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(31, 41, 51, 0.09)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
