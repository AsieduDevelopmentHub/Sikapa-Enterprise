/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sikapa: {
          crimson: "#941A20",
          "crimson-dark": "#7A1419",
          "bg-deep": "#3B2A25",
          gold: "#C8A96A",
          "gold-hover": "#A8894F",
          cream: "#F7F4F1",
          "gray-soft": "#EDEDED",
          "text-primary": "#1A1A1A",
          "text-secondary": "#6B6B6B",
          "text-muted": "#A0A0A0",
          "hero-subtext": "#F1EDE9",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["2rem", { lineHeight: "1.15" }], // 32px mobile
        "hero-lg": ["2.25rem", { lineHeight: "1.12" }], // 36px
        "page-title": ["1.25rem", { lineHeight: "1.3" }], // 20px
        "section-title": ["1.125rem", { lineHeight: "1.35" }], // 18px
        body: ["0.875rem", { lineHeight: "1.5" }], // 14px
        small: ["0.75rem", { lineHeight: "1.45" }], // 12px
      },
      maxWidth: {
        mobile: "430px",
      },
      keyframes: {
        "splash-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "gold-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(200, 169, 106, 0.35))" },
          "50%": { filter: "drop-shadow(0 0 20px rgba(200, 169, 106, 0.65))" },
        },
        "hero-model": {
          "0%": { opacity: "0", transform: "translateX(28px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "hero-text": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "hero-product": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "splash-in": "splash-in 0.9s ease-out forwards",
        "gold-glow": "gold-glow 2s ease-in-out infinite",
        "hero-model": "hero-model 1s ease-out 0.2s forwards",
        "hero-text": "hero-text 0.85s ease-out 0.35s forwards",
        "hero-product": "hero-product 0.7s ease-out 0.55s forwards",
        "hero-fade": "splash-in 1s ease-out forwards",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
