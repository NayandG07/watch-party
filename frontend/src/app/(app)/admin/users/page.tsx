"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Copy,
  Check,
  Users,
  Shield,
  ShieldCheck,
  ShieldOff,
  Link2,
  RefreshCw,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Invite {
  id: string;
  token: string;
  invite_url: string;
  expires_at: string;
  max_uses: number;
  use_count: number;
  is_revoked: boolean;
  is_valid: boolean;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: "level1" | "level2" | "super_admin";
  is_active: boolean;
  created_at: string;
}

type Tab = "users" | "invites";

// ── Role helpers ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  level1: "Level 1",
  level2: "Level 2",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  level1: "bg-content-muted/20 text-content-secondary",
  level2: "bg-brand-500/15 text-brand-400",
  super_admin: "bg-amber-500/15 text-amber-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

  // Invites state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get<User[]>("/api/users");
      setUsers(data);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true);
    try {
      const { data } = await api.get<Invite[]>("/api/invites");
      setInvites(data);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchInvites();
  }, [fetchUsers, fetchInvites]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick() {
      setOpenRoleDropdown(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingUserId(userId);
    setOpenRoleDropdown(null);
    try {
      const { data } = await api.patch<User>(`/api/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleToggleActive(user: User) {
    setUpdatingUserId(user.id);
    try {
      const { data } = await api.patch<User>(`/api/users/${user.id}`, {
        is_active: !user.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)));
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleGenerateInvite() {
    setGenerating(true);
    try {
      const { data } = await api.post<Invite>("/api/invites", {});
      setInvites((prev) => [data, ...prev]);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content-primary">
          Admin Panel
        </h1>
        <p className="text-content-secondary mt-1">
          Manage users, roles, and invite links for your platform.
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="glass border border-danger/30 bg-danger/5 text-danger px-4 py-3 rounded-xl text-sm flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-4 text-danger/60 hover:text-danger">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl w-fit">
        {(["users", "invites"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              tab === t
                ? "bg-brand-500 text-white shadow-brand"
                : "text-content-secondary hover:text-content-primary"
            )}
          >
            {t === "users" ? <Users className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {t === "users" ? "Users" : "Invite Links"}
          </button>
        ))}
      </div>

      {/* ── Users Tab ───────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-content-muted">
              {users.length} registered user{users.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", usersLoading && "animate-spin")} />
            </button>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            {usersLoading ? (
              <div className="p-8 text-center text-content-secondary">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-content-secondary">
                <Users className="w-12 h-12 mx-auto mb-4 text-brand-500/50" />
                <p className="text-sm">No users found.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_1fr_140px_100px_96px] gap-4 px-5 py-3 text-xs font-medium text-content-muted uppercase tracking-wider">
                  <span>User</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "grid grid-cols-[1fr_1fr_140px_100px_96px] gap-4 px-5 py-4 items-center transition-colors hover:bg-white/2",
                      !user.is_active && "opacity-50"
                    )}
                  >
                    {/* Username */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-content-primary truncate">
                        {user.username}
                      </span>
                    </div>

                    {/* Email */}
                    <span className="text-sm text-content-secondary truncate">
                      {user.email}
                    </span>

                    {/* Role Dropdown */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      {user.role === "super_admin" ? (
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", ROLE_COLORS[user.role])}>
                          <Shield className="w-3.5 h-3.5" />
                          Super Admin
                        </span>
                      ) : (
                        <button
                          onClick={() => setOpenRoleDropdown(openRoleDropdown === user.id ? null : user.id)}
                          disabled={updatingUserId === user.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:ring-1 hover:ring-brand-500/50 cursor-pointer",
                            ROLE_COLORS[user.role]
                          )}
                        >
                          {updatingUserId === user.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          {ROLE_LABELS[user.role]}
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        </button>
                      )}

                      {/* Dropdown */}
                      {openRoleDropdown === user.id && (
                        <div className="absolute top-full left-0 mt-1 z-20 glass rounded-xl shadow-card border border-surface-border overflow-hidden min-w-[140px]">
                          {["level1", "level2"].map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(user.id, role)}
                              className={cn(
                                "w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors",
                                user.role === role ? "text-brand-400" : "text-content-secondary"
                              )}
                            >
                              <ShieldCheck className="w-4 h-4" />
                              {ROLE_LABELS[role]}
                              {user.role === role && (
                                <Check className="w-3.5 h-3.5 ml-auto text-brand-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium w-fit",
                        user.is_active
                          ? "bg-success/15 text-success"
                          : "bg-danger/15 text-danger"
                      )}
                    >
                      {user.is_active ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      {user.is_active ? "Active" : "Inactive"}
                    </span>

                    {/* Actions */}
                    {user.role !== "super_admin" && (
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={updatingUserId === user.id}
                        title={user.is_active ? "Deactivate user" : "Activate user"}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          user.is_active
                            ? "text-danger hover:bg-danger/10"
                            : "text-success hover:bg-success/10"
                        )}
                      >
                        {user.is_active ? (
                          <><ShieldOff className="w-3.5 h-3.5" /> Suspend</>
                        ) : (
                          <><ShieldCheck className="w-3.5 h-3.5" /> Restore</>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Invites Tab ─────────────────────────────────────────────────────── */}
      {tab === "invites" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-content-muted">
              {invites.filter((i) => i.is_valid).length} active invite link{invites.filter((i) => i.is_valid).length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleGenerateInvite}
              disabled={generating}
              className="btn-primary h-10"
            >
              {generating ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Generate Link
            </button>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            {invitesLoading ? (
              <div className="p-8 text-center text-content-secondary">Loading invites...</div>
            ) : invites.length === 0 ? (
              <div className="p-12 text-center text-content-secondary">
                <Link2 className="w-12 h-12 mx-auto mb-4 text-brand-500/50" />
                <h3 className="text-lg font-medium text-content-primary mb-1">No invite links yet</h3>
                <p className="text-sm">Generate a link to invite users to your platform.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {invites.map((invite) => (
                  <div key={invite.id} className="p-4 flex items-center gap-4 hover:bg-white/2 transition-colors">
                    {/* Status dot */}
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      invite.is_valid ? "bg-success" : "bg-surface-border"
                    )} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-content-primary truncate max-w-md">
                          {invite.invite_url}
                        </span>
                        {invite.is_valid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-success/20 text-success shrink-0">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-surface-border text-content-muted shrink-0">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-content-muted flex gap-4">
                        <span>Uses: {invite.use_count} / {invite.max_uses}</span>
                        <span>Expires: {new Date(invite.expires_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(invite.id, invite.invite_url)}
                      className="p-2.5 rounded-xl hover:bg-surface-elevated text-content-secondary hover:text-content-primary transition-colors shrink-0"
                      title="Copy Link"
                    >
                      {copiedId === invite.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
