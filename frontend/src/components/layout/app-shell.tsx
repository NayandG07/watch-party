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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { tokenStorage } from "@/lib/api";
import { useRouter } from "next/navigation";

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
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-brand-500/15 text-brand-300 border border-brand-500/20"
          : "text-content-secondary hover:text-content-primary hover:bg-surface-elevated"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-brand-400")} />
      {item.label}
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();

  function handleLogout() {
    tokenStorage.clear();
    router.push("/login");
  }

  return (
    <aside className="flex flex-col h-full px-4 py-6">
      {/* Logo */}
      <Link
        href="/library"
        onClick={onClose}
        className="flex items-center gap-3 px-3 mb-8 group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-brand shadow-brand flex items-center justify-center shrink-0 group-hover:shadow-glow transition-shadow duration-300">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-base font-bold text-content-primary tracking-tight">
          Watch Party
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}

        <div className="divider !my-4" />

        {/* Admin section — visible to admins only in Phase 3 */}
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-surface-border pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-800 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-200">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-content-primary truncate">User</p>
            <p className="text-xs text-content-muted truncate">Member</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-ghost w-full justify-start gap-3 text-sm py-2.5 text-content-muted hover:text-danger hover:bg-danger/5"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-default">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 shrink-0 flex-col border-r border-surface-border bg-surface-base">
        <Sidebar />
      </div>

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
          className="absolute top-4 right-4 btn-ghost p-2"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-surface-border bg-surface-base shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-ghost p-2"
            aria-label="Open navigation"
            id="mobile-nav-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/library" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-brand flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-content-primary">Watch Party</span>
          </Link>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 md:p-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
