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
        // ── Primary Brand Palette (Rich Indigo) ───────────────
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",  // primary deep indigo
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // ── Accent Palette (Vibrant Coral / Emerald) ──────────
        accent: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",  // warm coral accent
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        // ── Live / Success Palette ────────────────────────────
        live: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          500: "#22c55e",  // sync live green
          600: "#16a34a",
          700: "#15803d",
        },
        // ── Surfaces (Cinematic Light) ────────────────────────
        surface: {
          base:     "#f8fafc",  // app background canvas
          default:  "#f8fafc",
          elevated: "#ffffff",  // card & modal surfaces
          overlay:  "#ffffff",
          border:   "#e2e8f0",  // subtle slate border
          borderStrong: "#cbd5e1",
        },
        // ── Text Content (High Contrast Slate) ────────────────
        content: {
          primary:   "#0f172a",  // deep slate charcoal
          secondary: "#475569",  // body text
          muted:     "#64748b",  // labels & metadata
          disabled:  "#cbd5e1",
        },
        // ── Semantic ────────────────────────────────────────────
        success: "#10b981",
        warning: "#f59e0b",
        danger:  "#ef4444",
        info:    "#3b82f6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "gradient-radial":    "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":     "linear-gradient(135deg, #4338ca 0%, #312e81 100%)",
        "gradient-accent":    "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        "gradient-hero":      "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        "gradient-spotlight": "radial-gradient(ellipse at top, rgba(67,56,202,0.08) 0%, transparent 70%)",
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
        brand:   "0 4px 14px rgba(67,56,202,0.22)",
        accent:  "0 4px 14px rgba(249,115,22,0.22)",
        card:    "0 2px 10px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.03)",
        "card-hover": "0 12px 32px rgba(15,23,42,0.1), 0 2px 8px rgba(15,23,42,0.04)",
        glow:    "0 0 20px rgba(67,56,202,0.18)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
