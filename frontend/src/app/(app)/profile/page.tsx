"use client";

import { useAuthStore } from "@/stores/authStore";
import { User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const roleLabel = user.role === "super_admin" ? "Super Admin" : user.role === "level2" ? "Level 2" : "Level 1";
  const roleColor =
    user.role === "super_admin"
      ? "bg-brand-500/20 text-brand-400"
      : user.role === "level2"
      ? "bg-indigo-500/20 text-indigo-400"
      : "bg-surface-elevated text-content-muted";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary tracking-tight">My Profile</h1>
        <p className="text-sm text-content-secondary mt-0.5">Your account information</p>
      </header>

      <div className="glass rounded-2xl p-6 border border-surface-border space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-brand shrink-0">
            <span className="text-2xl font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xl font-bold text-content-primary">{user.username}</p>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider mt-1", roleColor)}>
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="h-px bg-surface-border" />

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-content-muted shrink-0" />
            <span className="text-content-secondary">Username</span>
            <span className="ml-auto text-content-primary font-medium">{user.username}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="w-4 h-4 text-content-muted shrink-0" />
            <span className="text-content-secondary">Role</span>
            <span className="ml-auto text-content-primary font-medium">{roleLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
