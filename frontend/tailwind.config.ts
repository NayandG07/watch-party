import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand palette ──────────────────────────────────────
        brand: {
          50:  "#f4f8eb",
          100: "#e5efcf",
          200: "#cfe2a8",
          300: "#b1d17a",
          400: "#93bc51",
          500: "#78a83d",  // primary
          600: "#5f8730",
          700: "#486727",
          800: "#334a20",
          900: "#24351a",
          950: "#141d10",
        },
        // ── Surfaces (dark-first) ──────────────────────────────
        surface: {
          base:     "#0a0f0b",  // deepest background
          default:  "#111811",  // page background
          elevated: "#182118",  // cards, panels
          overlay:  "#202b1f",  // modals, dropdowns
          border:   "rgba(211, 231, 183, 0.12)",
        },
        // ── Text ───────────────────────────────────────────────
        content: {
          primary:   "#f1f6eb",
          secondary: "#abb7a3",
          muted:     "#6b7868",
          disabled:  "#3d493c",
        },
        // ── Semantic ────────────────────────────────────────────
        success: "#a4ce69",
        warning: "#e0ad56",
        danger:  "#e4776d",
        info:    "#8daec2",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "gradient-radial":    "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":     "linear-gradient(135deg, #c7e391 0%, #8ab94b 52%, #587e2e 100%)",
        "gradient-surface":   "linear-gradient(180deg, #1b261b 0%, #111811 100%)",
        "gradient-spotlight": "radial-gradient(ellipse at top, rgba(143, 184, 79, 0.17) 0%, transparent 70%)",
      },
      keyframes: {
        // Slide in from right (mobile drawers)
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        // Slide in from left
        "slide-in-left": {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        // Subtle float for decorative elements
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        // Subtle fade in used for page transitions
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Gentle pulse for loading states
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Subtle scale-up for card hover
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in":        "fade-in 0.25s ease-out forwards",
        "scale-in":       "scale-in 0.2s ease-out forwards",
        shimmer:          "shimmer 1.8s linear infinite",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        "slide-in-left":  "slide-in-left 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        float:            "float 4s ease-in-out infinite",
      },
      boxShadow: {
        brand:   "0 0 40px rgba(120, 168, 61, 0.22)",
        card:    "0 12px 36px rgba(0, 0, 0, 0.24)",
        "card-hover": "0 18px 44px rgba(0, 0, 0, 0.34)",
        glow:    "0 0 24px rgba(147, 188, 81, 0.32)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
