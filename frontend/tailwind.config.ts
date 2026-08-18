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
          50:  "#fff8f0",
          100: "#fae9d7",
          200: "#f3cfaf",
          300: "#dfaa7c",
          400: "#c98259",
          500: "#b86b48",  // primary
          600: "#96543a",
          700: "#713f2e",
          800: "#4d2b22",
          900: "#321d19",
          950: "#1e1110",
        },
        // ── Surfaces (dark-first) ──────────────────────────────
        surface: {
          base:     "var(--color-surface-base)",
          default:  "var(--color-surface-default)",
          elevated: "var(--color-surface-elevated)",
          overlay:  "var(--color-surface-overlay)",
          border:   "var(--color-border)",
        },
        // ── Text ───────────────────────────────────────────────
        content: {
          primary:   "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted:     "var(--color-text-muted)",
          disabled:  "var(--color-text-disabled)",
        },
        // ── Semantic ────────────────────────────────────────────
        success: "#5e8d5e",
        warning: "#b47d3c",
        danger:  "#b8534b",
        info:    "#667e91",
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
        "gradient-brand":     "linear-gradient(135deg, #f3cfaf 0%, #c98259 54%, #96543a 100%)",
        "gradient-surface":   "linear-gradient(180deg, var(--color-surface-elevated) 0%, var(--color-surface-default) 100%)",
        "gradient-spotlight": "radial-gradient(ellipse at top, rgba(201, 130, 89, 0.14) 0%, transparent 70%)",
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
        brand:   "0 0 40px rgba(184, 107, 72, 0.2)",
        card:    "0 12px 36px rgba(0, 0, 0, 0.18)",
        "card-hover": "0 18px 44px rgba(0, 0, 0, 0.28)",
        glow:    "0 0 24px rgba(201, 130, 89, 0.28)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
