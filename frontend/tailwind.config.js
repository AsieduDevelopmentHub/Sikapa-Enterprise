/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
        /** Splash: smooth logo entrance (no elastic bounce) */
        "splash-logo-enter": {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(16px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        /** Splash: soft dissolve exit */
        "splash-dissolve-out": {
          "0%": { opacity: "1", filter: "blur(0px)", transform: "scale(1)" },
          "100%": { opacity: "0", filter: "blur(14px)", transform: "scale(1.035)" },
        },
        /** Subtle gold shimmer on logo during splash */
        "splash-logo-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 6px rgba(200, 169, 106, 0.4))" },
          "50%": { filter: "drop-shadow(0 0 22px rgba(200, 169, 106, 0.85))" },
        },
      },
      animation: {
        "splash-in": "splash-in 0.9s ease-out forwards",
        "splash-logo-enter": "splash-logo-enter 1.75s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "splash-dissolve-out": "splash-dissolve-out 1.15s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "splash-logo-glow": "splash-logo-glow 2.2s ease-in-out infinite",
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
