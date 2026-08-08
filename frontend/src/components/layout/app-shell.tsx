"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Library,
  LogOut,
  Settings,
  Users,
  Tv2,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

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

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const isRoomPage = pathname?.startsWith("/room/");

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const allNavItems = [
    ...NAV_ITEMS,
    ...(user?.role === "level2" || user?.role === "super_admin" ? CREATOR_NAV_ITEMS : []),
    ...(user?.role === "super_admin" ? ADMIN_NAV_ITEMS : [])
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-stone-50 dark:bg-[#050505] transition-colors duration-300">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 dark:border-neutral-800/40 bg-white/85 dark:bg-[#050505]/85 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left section: Logo & Status */}
            <div className="flex items-center space-x-4">
              <Link href="/library" className="flex items-center space-x-3 group outline-none">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#050505] font-black text-sm group-hover:bg-amber-600 transition-colors">
                  W
                </div>
                <span className="font-display text-lg font-extrabold tracking-tight bg-gradient-to-r from-stone-900 via-stone-800 to-stone-700 dark:from-neutral-50 dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                  WatchParty
                </span>
              </Link>
              <span className="hidden md:block text-stone-300 dark:text-neutral-800">·</span>
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Synced
                </span>
              </div>
            </div>

            {/* Center section: Links (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-1">
              {allNavItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-stone-100 dark:bg-neutral-900 text-amber-500 font-bold"
                        : "text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200 hover:bg-stone-100 dark:hover:bg-neutral-900/40"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right section: Controls */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-1 md:space-x-2 mr-2">
                <ThemeToggle />
              </div>

              {/* User Avatar & Mobile Menu Toggle */}
              {user && (
                <div className="flex items-center space-x-3 border-l border-stone-200 dark:border-neutral-800/40 pl-4">
                  <div className="group relative">
                    <button className="w-8 h-8 rounded-full bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-800 text-xs font-black text-stone-900 dark:text-neutral-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                      {user.username.charAt(0).toUpperCase()}
                    </button>
                    {/* Simple Dropdown for Logout */}
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-950 border border-stone-200 dark:border-neutral-900 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                      <div className="px-4 py-3 border-b border-stone-100 dark:border-neutral-900">
                        <p className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">{user.username}</p>
                        <p className="text-xs text-stone-500 dark:text-zinc-500 truncate">{user.role.replace("_", " ")}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-500 hover:bg-stone-50 dark:hover:bg-neutral-900/40 transition-colors text-left rounded-b-xl"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="lg:hidden w-8 h-8 flex items-center justify-center text-stone-600 dark:text-zinc-400"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[70] w-[280px] bg-white dark:bg-neutral-950 border-l border-stone-200 dark:border-neutral-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-neutral-900">
          <span className="font-display font-bold text-stone-900 dark:text-white">Menu</span>
          <button onClick={() => setMobileOpen(false)} className="text-stone-500 dark:text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col space-y-2">
          {allNavItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-stone-100 dark:bg-neutral-900 text-amber-500"
                    : "text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-neutral-900/40"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {user && (
          <div className="p-4 border-t border-stone-100 dark:border-neutral-900">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 flex flex-col w-full",
          isRoomPage ? "" : "max-w-7xl mx-auto px-6 sm:px-8 py-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}
