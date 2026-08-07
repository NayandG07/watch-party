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
        // ── Brand palette (Deep Indigo) ───────────────────────
        brand: {
          50:  "#e8eaf6",
          100: "#c5cae9",
          200: "#9fa8da",
          300: "#7986cb",
          400: "#5c6bc0",
          500: "#3949ab",  // primary deep indigo
          600: "#303f9f",
          700: "#283593",
          800: "#1a237e",
          900: "#0d1452",
          950: "#06092b",
        },
        // ── Accent palette (Coral / Amber) ─────────────────────
        accent: {
          50:  "#fff3f0",
          100: "#ffe3dc",
          200: "#ffc9bb",
          300: "#ffa590",
          400: "#f88b70",
          500: "#e8795b",  // coral accent
          600: "#d35e40",
          700: "#b1482d",
          800: "#8e3923",
          900: "#743220",
        },
        // ── Surfaces (Light Cinematic) ───────────────────────
        surface: {
          base:     "#f4f7fb",  // page canvas background
          default:  "#f4f7fb",  // app background
          elevated: "#ffffff",  // cards, panels
          overlay:  "#ffffff",  // modals, dropdowns
          border:   "#e2e8f0",  // subtle border
          borderStrong: "#cbd5e1",
        },
        // ── Text Content (High Contrast Charcoal) ────────────
        content: {
          primary:   "#172033",  // dark charcoal
          secondary: "#546e7a",  // slate text
          muted:     "#90a4ae",  // muted slate
          disabled:  "#cbd5e1",  // disabled
        },
        // ── Semantic ────────────────────────────────────────────
        success: "#10b981",
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
        "gradient-brand":     "linear-gradient(135deg, #3949ab 0%, #283593 100%)",
        "gradient-accent":    "linear-gradient(135deg, #e8795b 0%, #d35e40 100%)",
        "gradient-surface":   "linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)",
        "gradient-spotlight": "radial-gradient(ellipse at top, rgba(57,73,171,0.08) 0%, transparent 70%)",
      },
      keyframes: {
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in":        "fade-in 0.2s ease-out forwards",
        "scale-in":       "scale-in 0.2s ease-out forwards",
        shimmer:          "shimmer 1.8s linear infinite",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        "slide-in-left":  "slide-in-left 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        float:            "float 4s ease-in-out infinite",
      },
      boxShadow: {
        brand:   "0 4px 14px rgba(57,73,171,0.25)",
        accent:  "0 4px 14px rgba(232,121,91,0.25)",
        card:    "0 2px 10px rgba(23,32,51,0.06), 0 1px 3px rgba(23,32,51,0.04)",
        "card-hover": "0 10px 30px rgba(23,32,51,0.12), 0 2px 8px rgba(23,32,51,0.06)",
        glow:    "0 0 20px rgba(57,73,171,0.2)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
