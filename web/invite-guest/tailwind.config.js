/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{tsx,ts}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F5F5",
        ink: "#0C0A09",
        muted: "#78716C",
        line: "#E7E5E4"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Libre Baskerville"', "Georgia", "serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(12, 10, 9, 0.06), 0 8px 24px rgba(12, 10, 9, 0.06)"
      }
    }
  },
  plugins: []
};
