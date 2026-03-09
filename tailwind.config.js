/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#13ec5b",
        "primary-dark": "#0ea341",
        "purple-deep": "#523980",
        "purple-soft": "#9072C6",
        "background-light": "#f6f8f6",
        "background-dark": "#102216",
        "text-main": "#333333",
        "text-muted": "#6B7280",
        "accent-surface": "#f0ebfa",
        "accent-purple": "#f5f3fa",
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
        sans: ["Lexend", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
