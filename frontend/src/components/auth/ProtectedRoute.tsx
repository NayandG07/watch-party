"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    // Attempt to load the user profile from API if we haven't already
    if (isInitializing) {
      initialize();
    }
  }, [initialize, isInitializing]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      // If we are definitely not authenticated, boot them to login
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, isAuthenticated, router, pathname]);

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-3 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">Authenticating…</span>
      </div>
    );
  }

  return <>{children}</>;
}
