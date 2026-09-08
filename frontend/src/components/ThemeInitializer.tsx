"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";

export default function ThemeInitializer() {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return null;
}
