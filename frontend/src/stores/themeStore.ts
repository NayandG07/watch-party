import { create } from "zustand";

export type ThemeId = "terracotta" | "ocean" | "sage" | "amethyst" | "rose" | "slate";
export type ModeId = "dark" | "light";

export interface ColorProfile {
  id: ThemeId;
  name: string;
  description: string;
  dotColor: string;
  primary: string;
  hover: string;
  secondary: string;
  glow: string;
  subtle: string;
  border: string;
  lightBackgroundTone: string;
  darkBackgroundTone: string;
}

export const COLOR_PROFILES: ColorProfile[] = [
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Warm & earthy (default)",
    dotColor: "#E06D53",
    primary: "#E06D53",
    hover: "#C85338",
    secondary: "#D97706",
    glow: "rgba(224, 109, 83, 0.38)",
    subtle: "rgba(224, 109, 83, 0.12)",
    border: "rgba(224, 109, 83, 0.28)",
    lightBackgroundTone: "Warm biscuit & linen sand",
    darkBackgroundTone: "Obsidian & warm terracotta ember",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep & focused",
    dotColor: "#2563EB",
    primary: "#2563EB",
    hover: "#1D4ED8",
    secondary: "#06B6D4",
    glow: "rgba(37, 99, 235, 0.38)",
    subtle: "rgba(37, 99, 235, 0.12)",
    border: "rgba(37, 99, 235, 0.28)",
    lightBackgroundTone: "Cool sea-mist & arctic pearl",
    darkBackgroundTone: "Abyssal navy & electric azure",
  },
  {
    id: "sage",
    name: "Sage",
    description: "Calm & natural",
    dotColor: "#2E7D5A",
    primary: "#2E7D5A",
    hover: "#236347",
    secondary: "#10B981",
    glow: "rgba(46, 125, 90, 0.38)",
    subtle: "rgba(46, 125, 90, 0.12)",
    border: "rgba(46, 125, 90, 0.28)",
    lightBackgroundTone: "Soft tea-dew & matcha pearl",
    darkBackgroundTone: "Deep pine forest & emerald glow",
  },
  {
    id: "amethyst",
    name: "Amethyst",
    description: "Bold & creative",
    dotColor: "#8B5CF6",
    primary: "#8B5CF6",
    hover: "#7C3AED",
    secondary: "#D946EF",
    glow: "rgba(139, 92, 246, 0.38)",
    subtle: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.28)",
    lightBackgroundTone: "Lavender cloud & lilac mist",
    darkBackgroundTone: "Twilight void & electric violet",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Vibrant & energetic",
    dotColor: "#F43F5E",
    primary: "#F43F5E",
    hover: "#E11D48",
    secondary: "#FB7185",
    glow: "rgba(244, 63, 94, 0.38)",
    subtle: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.28)",
    lightBackgroundTone: "Blush cashmere & rose quartz",
    darkBackgroundTone: "Velvet noir & radiant crimson",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Minimal & professional",
    dotColor: "#64748B",
    primary: "#64748B",
    hover: "#475569",
    secondary: "#94A3B8",
    glow: "rgba(100, 116, 139, 0.32)",
    subtle: "rgba(100, 116, 139, 0.12)",
    border: "rgba(100, 116, 139, 0.28)",
    lightBackgroundTone: "Studio titanium & cool silver",
    darkBackgroundTone: "Carbon slate & metallic graphite",
  },
];

interface ThemeState {
  currentTheme: ThemeId;
  currentMode: ModeId;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ModeId) => void;
  toggleMode: () => void;
  initTheme: () => void;
}

function applyThemeAndMode(theme: ThemeId, mode: ModeId) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-mode", mode);
  if (mode === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: "terracotta",
  currentMode: "dark",

  setTheme: (theme: ThemeId) => {
    const { currentMode } = get();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("watchparty_theme", theme);
        applyThemeAndMode(theme, currentMode);
      } catch (e) {
        console.error("Failed to persist theme to localStorage", e);
      }
    }
    set({ currentTheme: theme });
  },

  setMode: (mode: ModeId) => {
    const { currentTheme } = get();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("watchparty_mode", mode);
        applyThemeAndMode(currentTheme, mode);
      } catch (e) {
        console.error("Failed to persist mode to localStorage", e);
      }
    }
    set({ currentMode: mode });
  },

  toggleMode: () => {
    const nextMode: ModeId = get().currentMode === "dark" ? "light" : "dark";
    get().setMode(nextMode);
  },

  initTheme: () => {
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("watchparty_theme") as ThemeId | null;
        const validTheme = savedTheme && COLOR_PROFILES.some((p) => p.id === savedTheme) ? savedTheme : "terracotta";
        
        const savedMode = localStorage.getItem("watchparty_mode") as ModeId | null;
        const validMode = savedMode === "light" ? "light" : "dark";

        applyThemeAndMode(validTheme, validMode);
        set({ currentTheme: validTheme, currentMode: validMode });
      } catch {
        applyThemeAndMode("terracotta", "dark");
        set({ currentTheme: "terracotta", currentMode: "dark" });
      }
    }
  },
}));
