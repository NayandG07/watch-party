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
          50:  "#f0e7ff",
          100: "#dcc5ff",
          200: "#c49dff",
          300: "#a96bff",
          400: "#9145ff",
          500: "#7c2ff7",  // primary
          600: "#6820d4",
          700: "#5316a8",
          800: "#3e0e7c",
          900: "#290854",
          950: "#140326",
        },
        // ── Surfaces (dark-first) ──────────────────────────────
        surface: {
          base:     "#08080e",  // deepest background
          default:  "#0f0f1a",  // page background
          elevated: "#161624",  // cards, panels
          overlay:  "#1e1e30",  // modals, dropdowns
          border:   "rgba(255,255,255,0.07)",
        },
        // ── Text ───────────────────────────────────────────────
        content: {
          primary:   "#f2f2ff",
          secondary: "#9898b8",
          muted:     "#5a5a7a",
          disabled:  "#3a3a52",
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
        "gradient-brand":     "linear-gradient(135deg, #7c2ff7 0%, #c41ca8 100%)",
        "gradient-surface":   "linear-gradient(180deg, #161624 0%, #0f0f1a 100%)",
        "gradient-spotlight": "radial-gradient(ellipse at top, rgba(124,47,247,0.15) 0%, transparent 70%)",
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
        brand:   "0 0 40px rgba(124,47,247,0.25)",
        card:    "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6)",
        glow:    "0 0 20px rgba(124,47,247,0.4)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
