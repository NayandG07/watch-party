"use client";

import { Palette, Check, Sparkles, Moon, Sun } from "lucide-react";
import { COLOR_PROFILES, useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

export default function ThemePersonalisationCard() {
  const { currentTheme, currentMode, setTheme, setMode } = useThemeStore();
  const activeProfile = COLOR_PROFILES.find((p) => p.id === currentTheme) || COLOR_PROFILES[0];

  return (
    <div className="glass rounded-2xl p-6 md:p-8 border border-surface-border space-y-6 animate-fade-in shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Background subtle ambient glow based on active theme */}
      <div 
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none transition-all duration-500"
        style={{ backgroundColor: activeProfile.primary }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm"
            style={{ 
              backgroundColor: activeProfile.subtle, 
              borderColor: activeProfile.border,
              color: activeProfile.primary 
            }}
          >
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-content-primary tracking-tight">
                Theme Personalisation
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-surface-border bg-surface-elevated text-content-muted">
                <Sparkles className="w-3 h-3 text-amber-400" /> Instant
              </span>
            </div>
            <p className="text-sm text-content-secondary mt-1">
              Choose your accent colour & atmospheric mode — applied instantly across the entire app.
            </p>
          </div>
        </div>

        {/* Mode Toggle Pills (Dark / Light) */}
        <div className="flex items-center p-1 rounded-xl bg-surface-elevated border border-surface-border self-start">
          <button
            onClick={() => setMode("dark")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              currentMode === "dark"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-content-secondary hover:text-content-primary"
            )}
            aria-label="Switch to Dark Mode"
          >
            <Moon className="w-3.5 h-3.5" />
            Dark Mode
          </button>
          <button
            onClick={() => setMode("light")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              currentMode === "light"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-content-secondary hover:text-content-primary"
            )}
            aria-label="Switch to Light Mode"
          >
            <Sun className="w-3.5 h-3.5" />
            Light Mode
          </button>
        </div>
      </div>

      {/* 6 Theme Swatches (Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {COLOR_PROFILES.map((profile) => {
          const isSelected = profile.id === currentTheme;
          return (
            <button
              key={profile.id}
              onClick={() => setTheme(profile.id)}
              className={cn(
                "flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300 relative group cursor-pointer border select-none",
                isSelected
                  ? "bg-surface-elevated shadow-lg scale-[1.02]"
                  : "bg-surface-elevated/50 hover:bg-surface-elevated border-surface-border/40 hover:border-surface-border"
              )}
              style={{
                borderColor: isSelected ? profile.primary : undefined,
                boxShadow: isSelected ? `0 0 20px ${profile.glow}` : undefined,
              }}
              aria-label={`Select ${profile.name} theme`}
            >
              {/* Swatch circle with checkmark if selected */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md transition-transform duration-300 group-hover:scale-105 relative"
                style={{ backgroundColor: profile.dotColor }}
              >
                {isSelected ? (
                  <Check className="w-6 h-6 text-white stroke-[3] drop-shadow-md animate-scale-in" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-black/20" />
                )}
              </div>

              {/* Theme Name */}
              <span className="text-sm font-bold text-content-primary tracking-tight">
                {profile.name}
              </span>

              {/* Theme Micro-Description */}
              <span className="text-[11px] text-content-muted mt-1 leading-tight line-clamp-2">
                {profile.description}
              </span>

              {/* Active Selection Glow Ring */}
              {isSelected && (
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none border-2"
                  style={{ borderColor: profile.primary }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Atmospheric Tone & Active Status */}
      <div className="pt-2 border-t border-surface-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-elevated border border-surface-border">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-3.5 h-3.5 rounded-full shadow-sm animate-pulse shrink-0"
              style={{ backgroundColor: activeProfile.dotColor }} 
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-content-primary font-semibold">
                {activeProfile.name} ({currentMode === "dark" ? "Dark Mode" : "Light Mode"})
              </span>
              <span className="hidden sm:inline text-content-muted">•</span>
              <span className="text-xs text-content-secondary">
                Atmosphere: {currentMode === "dark" ? activeProfile.darkBackgroundTone : activeProfile.lightBackgroundTone}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-content-muted self-start sm:self-auto">
            {activeProfile.primary}
          </span>
        </div>
      </div>

      {/* Live UI Preview Widgets */}
      <div className="pt-3 border-t border-surface-border space-y-3">
        <h3 className="text-xs font-semibold text-content-muted uppercase tracking-wider">
          Live UI Preview
        </h3>

        <div className="p-4 rounded-xl bg-surface-base border border-surface-border flex flex-wrap items-center gap-4 transition-colors">
          <button className="btn-primary text-xs px-4 py-2">
            Primary Action
          </button>
          <button className="btn-secondary text-xs px-4 py-2">
            Secondary
          </button>
          <span className="badge-brand text-xs font-semibold">
            Badge Accent
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-[200px]">
            <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-surface-border">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ width: "65%", backgroundColor: activeProfile.primary }}
              />
            </div>
            <span className="text-[11px] text-content-muted font-mono">65%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
