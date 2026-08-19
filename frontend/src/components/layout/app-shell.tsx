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
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import ThemeToggle from "@/components/theme-toggle";

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
        isActive ? "nav-item-active" : "nav-item-inactive"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-brand-400" : "text-content-muted group-hover/item:text-content-primary")} />
      <span className="truncate whitespace-nowrap transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100 font-medium">
        {item.label}
      </span>
    </Link>
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
        className="flex items-center gap-3 px-5 mb-8 group shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-brand shadow-brand flex items-center justify-center shrink-0 group-hover:shadow-glow transition-shadow duration-300">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-base font-bold text-content-primary tracking-tight transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100 whitespace-nowrap">
          Watch Party
        </span>
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
        {((user?.role === "level2" || user?.role === "super_admin" || user?.role === "super_admin") && (CREATOR_NAV_ITEMS.length > 0 || ADMIN_NAV_ITEMS.length > 0)) && (
          <div>
            <h2 className="sidebar-label px-2 mb-2 transition-opacity duration-200 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">
              MANAGE
            </h2>
            <div className="space-y-1">
              {(user?.role === "level2" || user?.role === "super_admin") && CREATOR_NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} onClick={onClose} />
              ))}
              {user?.role === "super_admin" && ADMIN_NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} onClick={onClose} />
              ))}
            </div>
          </div>
        )}
      </nav>

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
                <span className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  user.role === "super_admin" ? "bg-brand-500/20 text-brand-400" :
                  user.role === "level2" ? "bg-brand-500/15 text-brand-600 dark:text-brand-200" :
                  "bg-surface-elevated text-content-muted"
                )}>
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-content-muted group-hover/profile:text-brand-400 shrink-0 transition-all duration-200 group-hover/profile:translate-x-0.5 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100" />
          </Link>
        )}
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-content-muted">Appearance</span>
          <ThemeToggle />
        </div>
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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  // Room pages need the full viewport — no padding/scrolling wrapper
  const isRoomPage = pathname?.startsWith("/room/");
  
  const getPageTitle = () => {
    if (pathname?.startsWith("/library")) return "Library";
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
        {/* Mobile top bar — hidden on room pages (room has its own header) */}
        {!isRoomPage && (
          <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-surface-border bg-surface-base shrink-0 z-10">
            <button
              onClick={() => setMobileOpen(true)}
              className="btn-ghost p-2 -ml-2 rounded-full"
              aria-label="Open navigation"
              id="mobile-nav-toggle"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center justify-center -ml-6 pointer-events-none">
              <span className="text-base font-bold text-content-primary">{getPageTitle()}</span>
            </div>
            <ThemeToggle />
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
            className="flex-1 overflow-y-auto p-6 md:p-8"
            tabIndex={-1}
          >
            {children}
          </main>
        )}
      </div>
    </div>
  );
}
