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
        // ── Semantic Status Colors ──────────────────────────────
        success: "#10b981",
        warning: "#f59e0b",
        danger:  "#ef4444",
        info:    "#3b82f6",
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "gradient-radial":    "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":     "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        "gradient-accent":    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        "gradient-hero":      "linear-gradient(180deg, #050505 0%, #0a0a0a 100%)",
        "gradient-spotlight": "radial-gradient(ellipse at top, rgba(245,158,11,0.06) 0%, transparent 70%)",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-bottom": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-top": {
          "0%":   { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "float-up": {
          "0%":   { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-120px) scale(1.4)" },
        },
      },
      animation: {
        "fade-in":          "fade-in 0.3s ease-out forwards",
        "scale-in":         "scale-in 0.2s ease-out forwards",
        shimmer:            "shimmer 1.8s linear infinite",
        "slide-in-right":   "slide-in-right 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        "slide-in-left":    "slide-in-left 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        "slide-in-bottom":  "slide-in-bottom 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        "slide-in-top":     "slide-in-top 0.2s cubic-bezier(0.19, 1, 0.22, 1) forwards",
        float:              "float 4s ease-in-out infinite",
        "float-up":         "float-up 2s ease-out forwards",
      },
      boxShadow: {
        "brand":      "0 4px 14px rgba(245,158,11,0.22)",
        "brand-glow": "0 0 15px rgba(245,158,11,0.15)",
        "card":       "0 2px 10px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)",
        "card-hover": "0 12px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)",
        "glow":       "0 0 20px rgba(245,158,11,0.18)",
        "2xl":        "0 25px 50px -12px rgba(0,0,0,0.25)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
