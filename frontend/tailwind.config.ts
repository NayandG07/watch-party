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
        // ── Dynamic Brand palette (responsive to active theme) ──────
        brand: {
          50:  "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          950: "rgb(var(--brand-950) / <alpha-value>)",
        },
        // ── Dynamic Surfaces (responsive to active theme & mode) ────
        surface: {
          base:     "var(--color-surface-base)",      // deepest background
          default:  "var(--color-surface-default)",   // page background
          elevated: "var(--color-surface-elevated)",  // cards, panels
          overlay:  "var(--color-surface-overlay)",   // modals, dropdowns
          border:   "var(--color-border)",
        },
        // ── Dynamic Content (responsive to active theme & mode) ────
        content: {
          primary:   "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted:     "var(--color-text-muted)",
          disabled:  "var(--color-text-disabled)",
        },
        // ── Semantic ────────────────────────────────────────────
        success: "#22c55e",
        warning: "#f59e0b",
        danger:  "#ef4444",
        info:    "#3b82f6",
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
        "gradient-brand":     "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-secondary) 100%)",
        "gradient-surface":   "linear-gradient(180deg, var(--color-surface-elevated) 0%, var(--color-surface-default) 100%)",
        "gradient-spotlight": "radial-gradient(ellipse at top, var(--color-brand-glow) 0%, transparent 70%)",
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
        brand:   "0 0 40px var(--color-brand-glow)",
        card:    "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        glow:    "0 0 20px var(--color-brand-glow)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
