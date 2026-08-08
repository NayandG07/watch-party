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
  Trash2,
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
  level1: "bg-stone-100 dark:bg-neutral-900 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-neutral-800",
  level2: "text-amber-500 bg-amber-500/10 border border-amber-500/20",
  super_admin: "bg-amber-500 text-[#050505] border border-amber-500 font-bold",
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

  async function handleDeleteUser(user: User) {
    if (!window.confirm(`Are you sure you want to permanently delete user ${user.username}?`)) return;
    setUpdatingUserId(user.id);
    try {
      await api.delete(`/api/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
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
    <div className="max-w-6xl mx-auto w-full animate-fade-in space-y-8 px-4 sm:px-6 pt-4 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Administration</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
          User & Invite Management
        </h1>
        <p className="text-stone-500 dark:text-zinc-400 text-sm mt-1">
          Manage user accounts, platform access privileges, and invite links.
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-2xl text-xs sm:text-sm flex justify-between items-center font-medium">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-4 hover:text-rose-400">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-stone-200 dark:border-neutral-900 mb-6">
        {(["users", "invites"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
              tab === t
                ? "border-b-2 border-amber-500 text-amber-500"
                : "border-b-2 border-transparent text-stone-400 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200"
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
            <p className="text-xs font-mono font-bold text-stone-500 dark:text-zinc-400">
              {users.length} registered user{users.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-neutral-900 transition-colors"
              title="Refresh Users"
            >
              <RefreshCw className={cn("w-4 h-4", usersLoading && "animate-spin")} />
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 rounded-2xl overflow-hidden shadow-xl">
            {usersLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-stone-500 dark:text-zinc-400">Loading registered users...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-stone-500 dark:text-zinc-400">
                <Users className="w-10 h-10 mx-auto mb-3 text-stone-300 dark:text-zinc-600" />
                <p className="font-display text-sm font-bold text-stone-900 dark:text-white">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-neutral-900 bg-stone-50 dark:bg-neutral-900/40 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-500">
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-neutral-900 text-sm text-stone-800 dark:text-zinc-200">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={cn(
                          "hover:bg-stone-50 dark:hover:bg-neutral-900/20 transition-colors",
                          !user.is_active && "opacity-60"
                        )}
                      >
                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/20">
                              {user.username[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-stone-900 dark:text-white truncate">
                              {user.username}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 text-stone-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </td>

                        {/* Role Dropdown */}
                        <td className="px-5 py-4 relative" onClick={(e) => e.stopPropagation()}>
                          {user.role === "super_admin" ? (
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold", ROLE_COLORS[user.role])}>
                              <Shield className="w-3.5 h-3.5" />
                              Super Admin
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                setOpenRoleDropdown(openRoleDropdown === user.id ? null : user.id);
                              }}
                              disabled={updatingUserId === user.id}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer min-h-[30px] hover:border-amber-500",
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
                            <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-neutral-950 border border-stone-200 dark:border-neutral-900 rounded-xl shadow-2xl overflow-hidden min-w-[140px] p-1 animate-fade-in">
                              {["level1", "level2"].map((role) => (
                                <button
                                  key={role}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    handleRoleChange(user.id, role);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 text-left text-xs font-bold flex items-center gap-2 rounded-lg transition-colors",
                                    user.role === role ? "text-amber-500 bg-amber-500/10" : "text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-neutral-900"
                                  )}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  {ROLE_LABELS[role]}
                                  {user.role === role && (
                                    <Check className="w-3.5 h-3.5 ml-auto text-amber-500" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border",
                              user.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            )}
                          >
                            {user.is_active ? (
                              <UserCheck className="w-3 h-3" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            {user.is_active ? "Active" : "Suspended"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          {user.role !== "super_admin" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleActive(user)}
                                disabled={updatingUserId === user.id}
                                title={user.is_active ? "Suspend account" : "Restore account"}
                                className={cn(
                                  "h-8 px-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center transition-colors border border-transparent",
                                  user.is_active
                                    ? "text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/20"
                                    : "text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                                )}
                              >
                                {user.is_active ? (
                                  <><ShieldOff className="w-3.5 h-3.5 mr-1" /> Suspend</>
                                ) : (
                                  <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Restore</>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={updatingUserId === user.id}
                                title="Delete user"
                                className="h-8 px-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center transition-colors border border-transparent text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Invites Tab ─────────────────────────────────────────────────────── */}
      {tab === "invites" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-bold text-stone-500 dark:text-zinc-400">
              {invites.filter((i) => i.is_valid).length} active invite link{invites.filter((i) => i.is_valid).length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleGenerateInvite}
              disabled={generating}
              className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider active:scale-[0.98] h-10 px-4 rounded-xl flex items-center justify-center transition-all min-h-[40px]"
            >
              {generating ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#050505]/30 border-t-[#050505] animate-spin mr-1.5" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              Generate Invite Link
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 rounded-2xl overflow-hidden shadow-xl">
            {invitesLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-stone-500 dark:text-zinc-400">Loading invite links...</div>
            ) : invites.length === 0 ? (
              <div className="p-12 text-center text-stone-500 dark:text-zinc-400">
                <Link2 className="w-10 h-10 mx-auto mb-3 text-stone-300 dark:text-zinc-600" />
                <h3 className="font-display text-sm font-bold text-stone-900 dark:text-white mb-1">No invite links generated</h3>
                <p className="text-xs">Generate an invite link to invite users to your platform.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-neutral-900">
                {invites.map((invite) => (
                  <div key={invite.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-neutral-900/20 transition-colors">
                    {/* Status dot */}
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      invite.is_valid ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-stone-300 dark:bg-neutral-700"
                    )} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[11px] text-stone-800 dark:text-zinc-300 truncate max-w-md bg-stone-100 dark:bg-neutral-900 px-2.5 py-1 rounded border border-stone-200 dark:border-neutral-800">
                          {invite.invite_url}
                        </span>
                        {invite.is_valid ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                            Active
                          </span>
                        ) : (
                          <span className="bg-stone-100 dark:bg-neutral-900 text-stone-500 dark:text-zinc-500 border border-stone-200 dark:border-neutral-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-zinc-500 flex gap-4 font-mono">
                        <span>Uses: {invite.use_count} / {invite.max_uses}</span>
                        <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(invite.id, invite.invite_url)}
                      className="bg-stone-100 dark:bg-neutral-900 hover:bg-stone-200 dark:hover:bg-neutral-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-neutral-800 h-9 px-3 rounded-xl flex items-center justify-center font-bold text-[11px] uppercase tracking-wider transition-all min-h-[36px]"
                      title="Copy Invite URL"
                    >
                      {copiedId === invite.id ? (
                        <Check className="w-4 h-4 text-emerald-500 mr-1" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      <span>{copiedId === invite.id ? "Copied" : "Copy"}</span>
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
