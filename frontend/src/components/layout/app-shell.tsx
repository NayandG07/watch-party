"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Library,
  LogOut,
  Settings,
  Users,
  Tv2,
  Menu,
  X,
  ChevronRight,
  Palette,
  User as UserIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore, COLOR_PROFILES } from "@/stores/themeStore";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/library", label: "Library", icon: Library },
  { href: "/rooms", label: "Rooms", icon: Tv2 },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Users },
];

const CREATOR_NAV_ITEMS: NavItem[] = [
  { href: "/admin/settings/storage", label: "Storage", icon: Settings },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname?.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "nav-item group/item",
        isActive ? "nav-item-active font-semibold shadow-sm" : "nav-item-inactive"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-brand-400" : "text-content-muted group-hover/item:text-content-primary")} />
      <span className="truncate whitespace-nowrap transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100 font-medium">
        {item.label}
      </span>
    </Link>
  );
}

function QuickThemeSelector() {
  const { currentTheme, setTheme, currentMode, setMode, toggleMode } = useThemeStore();
  const [open, setOpen] = useState(false);
  const activeProfile = COLOR_PROFILES.find((p) => p.id === currentTheme) || COLOR_PROFILES[0];

  return (
    <div className="relative px-2 mb-3">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-elevated/80 hover:bg-surface-elevated border border-surface-border hover:border-brand-500/30 transition-all text-xs text-content-secondary hover:text-content-primary shadow-sm"
          title="Change theme color & mode"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-1 ring-white/10"
              style={{ backgroundColor: activeProfile.dotColor }}
            />
            <span className="truncate transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100 font-medium">
              {activeProfile.name}
            </span>
          </div>
          <Palette className="w-3.5 h-3.5 text-content-muted shrink-0 transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100" />
        </button>

        <button
          onClick={toggleMode}
          className="p-2 rounded-xl bg-surface-elevated/80 hover:bg-surface-elevated border border-surface-border text-content-secondary hover:text-content-primary transition-all shrink-0 shadow-sm"
          title={currentMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          id="sidebar-mode-toggle"
        >
          {currentMode === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-brand-500" />
          )}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-2 mb-2 z-50 glass rounded-2xl shadow-2xl p-3 border border-surface-border w-64 animate-scale-in">
            {/* Mode Switcher inside Popover */}
            <div className="mb-3 pb-2.5 border-b border-surface-border">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                  Appearance
                </span>
                <span className="text-[10px] text-brand-400 font-medium capitalize">
                  {currentMode} Mode
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-base rounded-xl border border-surface-border">
                <button
                  type="button"
                  onClick={() => setMode("dark")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all",
                    currentMode === "dark"
                      ? "bg-surface-elevated text-content-primary shadow-sm border border-surface-border"
                      : "text-content-muted hover:text-content-primary"
                  )}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("light")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all",
                    currentMode === "light"
                      ? "bg-surface-elevated text-content-primary shadow-sm border border-surface-border"
                      : "text-content-muted hover:text-content-primary"
                  )}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            {/* Color Profiles */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1">
                <Palette className="w-3 h-3 text-brand-400" /> Color Accent
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {COLOR_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setTheme(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl border transition-all text-center group",
                    p.id === currentTheme
                      ? "bg-brand-500/15 border-brand-500 shadow-sm scale-105"
                      : "bg-surface-elevated/60 border-transparent hover:border-surface-border"
                  )}
                >
                  <div
                    className="w-4 h-4 rounded-full mb-1 shadow-sm transition-transform group-hover:scale-110 ring-1 ring-white/10"
                    style={{ backgroundColor: p.dotColor }}
                  />
                  <span className="text-[10px] font-semibold text-content-primary truncate w-full">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex flex-col h-full py-6 overflow-hidden">
      {/* Logo */}
      <Link
        href="/library"
        onClick={onClose}
        className="flex items-center gap-3 px-5 mb-4 group shrink-0"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-brand shadow-brand flex items-center justify-center shrink-0 group-hover:shadow-glow transition-all duration-300">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="flex flex-col transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100 whitespace-nowrap">
          <span className="text-base font-bold text-content-primary tracking-tight leading-none">
            Watch Party
          </span>
          <span className="text-[10px] text-content-muted tracking-wider uppercase font-semibold mt-1">
            Binge2gether
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-3" aria-label="Main navigation">
        <div>
          <h2 className="sidebar-label px-2 mb-2 transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">
            NAVIGATE
          </h2>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} onClick={onClose} />
            ))}
          </div>
        </div>

        {/* Manage section */}
        {((user?.role === "level2" || user?.role === "super_admin") &&
          (CREATOR_NAV_ITEMS.length > 0 || ADMIN_NAV_ITEMS.length > 0)) && (
          <div>
            <h2 className="sidebar-label px-2 mb-2 transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">
              MANAGE
            </h2>
            <div className="space-y-1">
              {(user?.role === "level2" || user?.role === "super_admin") &&
                CREATOR_NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} item={item} onClick={onClose} />
                ))}
              {user?.role === "super_admin" &&
                ADMIN_NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} item={item} onClick={onClose} />
                ))}
            </div>
          </div>
        )}
      </nav>

      {/* Theme Quick Selector */}
      <QuickThemeSelector />

      {/* User section */}
      <div className="border-t border-surface-border pt-4 px-3 shrink-0">
        {user && (
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-2 py-2 mb-2 overflow-hidden rounded-xl hover:bg-brand-500/10 hover:border-brand-500/20 border border-transparent transition-all duration-200 group/profile"
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center shrink-0 shadow-sm group-hover/profile:shadow-brand transition-shadow">
              <span className="text-sm font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">
              <p className="text-sm font-medium text-content-primary truncate">{user.username}</p>
              <div className="mt-0.5">
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                    user.role === "super_admin"
                      ? "bg-brand-500/20 text-brand-400"
                      : user.role === "level2"
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "bg-surface-elevated text-content-muted"
                  )}
                >
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-content-muted group-hover/profile:text-brand-400 shrink-0 transition-all duration-200 group-hover/profile:translate-x-0.5 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100" />
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-content-muted hover:text-danger hover:bg-danger/10 transition-colors group/logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="truncate whitespace-nowrap transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isLibraryActive = pathname?.startsWith("/library");
  const isRoomsActive = pathname?.startsWith("/rooms");
  const isProfileActive = pathname?.startsWith("/profile");
  const isStorageActive = pathname?.startsWith("/admin/settings/storage");

  return (
    <nav 
      className="md:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-2xl bg-surface-base/90 border-t border-surface-border px-3 py-2 flex items-center justify-around shadow-2xl safe-area-bottom"
      aria-label="Mobile bottom navigation"
    >
      <Link
        href="/library"
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all",
          isLibraryActive ? "text-brand-400" : "text-content-muted hover:text-content-primary"
        )}
      >
        <Library className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Library</span>
        {isLibraryActive && (
          <span className="w-1 h-1 rounded-full bg-brand-400 -mt-0.5 shadow-sm" />
        )}
      </Link>

      <Link
        href="/rooms"
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all",
          isRoomsActive ? "text-brand-400" : "text-content-muted hover:text-content-primary"
        )}
      >
        <Tv2 className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Rooms</span>
        {isRoomsActive && (
          <span className="w-1 h-1 rounded-full bg-brand-400 -mt-0.5 shadow-sm" />
        )}
      </Link>

      {(user?.role === "level2" || user?.role === "super_admin") && (
        <Link
          href="/admin/settings/storage"
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all",
            isStorageActive ? "text-brand-400" : "text-content-muted hover:text-content-primary"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Storage</span>
          {isStorageActive && (
            <span className="w-1 h-1 rounded-full bg-brand-400 -mt-0.5 shadow-sm" />
          )}
        </Link>
      )}

      <Link
        href="/profile"
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all",
          isProfileActive ? "text-brand-400" : "text-content-muted hover:text-content-primary"
        )}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Profile</span>
        {isProfileActive && (
          <span className="w-1 h-1 rounded-full bg-brand-400 -mt-0.5 shadow-sm" />
        )}
      </Link>
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Room pages and movie detail pages have custom full viewport / bottom action bars
  const isRoomPage = pathname?.startsWith("/room/");
  const isMoviePage = pathname?.startsWith("/movie/");
  const hideMobileNav = isRoomPage || isMoviePage;

  const getPageTitle = () => {
    if (pathname?.startsWith("/library")) return "Library";
    if (pathname?.startsWith("/movie/")) return "Movie Details";
    if (pathname?.startsWith("/rooms")) return "Rooms";
    if (pathname?.startsWith("/admin/settings")) return "Settings";
    if (pathname?.startsWith("/admin/users")) return "Users";
    if (pathname?.startsWith("/profile")) return "Profile";
    return "";
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-default">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col border-r border-surface-border bg-surface-base w-16 lg:w-[256px] hover:w-[256px] transition-[width] duration-300 ease-out z-40 group/sidebar shrink-0 absolute lg:relative h-full">
        <Sidebar />
      </div>

      {/* Spacer for absolute sidebar on tablet */}
      <div className="hidden md:block lg:hidden w-16 shrink-0 h-full border-r border-transparent" aria-hidden="true" />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-surface-base border-r border-surface-border",
          "transform transition-transform duration-300 ease-out-expo md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute top-4 right-4 btn-ghost p-2 rounded-full"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          id="mobile-nav-close"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Universal top bar — hidden on room pages */}
        {!isRoomPage && (
          <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-surface-border bg-surface-base/90 backdrop-blur-md shrink-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden btn-ghost p-2 -ml-2 rounded-full"
                aria-label="Open navigation"
                id="mobile-nav-toggle"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-base font-bold text-content-primary tracking-tight">{getPageTitle()}</span>
            </div>
          </header>
        )}

        {/* Page content */}
        {isRoomPage ? (
          // Room pages: full-bleed, no padding, no overflow scroll
          <div id="main-content" className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
        ) : (
          <main
            id="main-content"
            className={cn(
              "flex-1 overflow-y-auto p-4 sm:p-6 md:p-8",
              hideMobileNav ? "pb-24 md:pb-8" : "pb-24 md:pb-8"
            )}
            tabIndex={-1}
          >
            {children}
          </main>
        )}

        {/* Mobile Bottom Navigation Bar (Hidden on Room page and Movie details) */}
        {!hideMobileNav && <MobileBottomNav />}
      </div>
    </div>
  );
}
