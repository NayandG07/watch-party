"use client";

import { useAuthStore } from "@/stores/authStore";
import { User, Shield, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemePersonalisationCard from "@/components/profile/ThemePersonalisationCard";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const roleLabel = user.role === "super_admin" ? "Super Admin" : user.role === "level2" ? "Level 2" : "Level 1";
  const roleColor =
    user.role === "super_admin"
      ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
      : user.role === "level2"
      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
      : "bg-surface-elevated text-content-muted border border-white/10";

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Member";

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8 pb-12">
      {/* Header */}
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary tracking-tight">
          Account & Preferences
        </h1>
        <p className="text-sm text-content-secondary mt-1">
          Personalise your watch party experience, theme appearance, and profile details.
        </p>
      </header>

      {/* Theme Personalisation Card (Primary Feature) */}
      <ThemePersonalisationCard />

      {/* Profile Details Card */}
      <div className="glass rounded-2xl p-6 md:p-8 border border-surface-border space-y-6">
        <h2 className="text-lg font-bold text-content-primary tracking-tight">
          Profile Information
        </h2>

        {/* Avatar & User Header */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand shrink-0 text-white font-bold text-2xl">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-content-primary">{user.username}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", roleColor)}>
                {roleLabel}
              </span>
              <span className="text-xs text-content-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined {memberSince}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-surface-border" />

        {/* Details List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated/50 border border-white/5">
            <User className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-content-muted uppercase tracking-wider">Username</p>
              <p className="text-sm text-content-primary font-medium truncate">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated/50 border border-white/5">
            <Mail className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-content-muted uppercase tracking-wider">Email</p>
              <p className="text-sm text-content-primary font-medium truncate">{user.email || "Private"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated/50 border border-white/5">
            <Shield className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-content-muted uppercase tracking-wider">Platform Role</p>
              <p className="text-sm text-content-primary font-medium">{roleLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated/50 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] ml-1" />
            <div className="min-w-0 ml-1">
              <p className="text-[11px] text-content-muted uppercase tracking-wider">Account Status</p>
              <p className="text-sm text-content-primary font-medium">Active & Verified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
