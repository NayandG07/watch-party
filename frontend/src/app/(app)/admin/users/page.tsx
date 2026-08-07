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
  level1: "bg-slate-100 text-slate-700 border border-slate-200",
  level2: "bg-brand-50 text-brand-700 border border-brand-200",
  super_admin: "bg-amber-50 text-amber-800 border border-amber-200 font-bold",
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary">
          User & Invite Management
        </h1>
        <p className="text-content-secondary text-sm mt-1">
          Manage user accounts, platform access privileges, and invite links.
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex justify-between items-center font-medium">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-4 text-red-500 hover:text-red-800">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
        {(["users", "invites"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 min-h-[38px]",
              tab === t
                ? "bg-white text-brand-700 shadow-card border border-slate-200/80"
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
            <p className="text-xs font-semibold text-content-muted">
              {users.length} registered user{users.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-slate-100 transition-colors"
              title="Refresh Users"
            >
              <RefreshCw className={cn("w-4 h-4", usersLoading && "animate-spin")} />
            </button>
          </div>

          <div className="card overflow-hidden">
            {usersLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-content-secondary">Loading registered users...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-content-secondary">
                <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-content-primary">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-content-muted uppercase tracking-wider">
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-content-primary">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={cn(
                          "hover:bg-slate-50/80 transition-colors",
                          !user.is_active && "opacity-60 bg-slate-50/40"
                        )}
                      >
                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-200">
                              {user.username[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-content-primary truncate">
                              {user.username}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 text-content-secondary truncate">
                          {user.email}
                        </td>

                        {/* Role Dropdown */}
                        <td className="px-5 py-4 relative" onClick={(e) => e.stopPropagation()}>
                          {user.role === "super_admin" ? (
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold", ROLE_COLORS[user.role])}>
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
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:border-brand-400 cursor-pointer min-h-[30px]",
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
                            <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-2xl shadow-card-hover border border-slate-200 overflow-hidden min-w-[140px] p-1 animate-fade-in">
                              {["level1", "level2"].map((role) => (
                                <button
                                  key={role}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    handleRoleChange(user.id, role);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 rounded-xl hover:bg-slate-50 transition-colors",
                                    user.role === role ? "text-brand-700 bg-brand-50" : "text-content-secondary"
                                  )}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  {ROLE_LABELS[role]}
                                  {user.role === role && (
                                    <Check className="w-3.5 h-3.5 ml-auto text-brand-700" />
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
                              "badge font-bold",
                              user.is_active ? "badge-success" : "bg-red-50 text-red-600 border border-red-200"
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
                                  "btn-ghost h-8 px-2.5 text-xs font-bold rounded-xl",
                                  user.is_active
                                    ? "text-amber-600 hover:bg-amber-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
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
                                className="btn-ghost h-8 px-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl"
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
            <p className="text-xs font-semibold text-content-muted">
              {invites.filter((i) => i.is_valid).length} active invite link{invites.filter((i) => i.is_valid).length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleGenerateInvite}
              disabled={generating}
              className="btn-primary h-10 px-4 text-xs font-bold shadow-brand min-h-[40px]"
            >
              {generating ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1.5" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              Generate Invite Link
            </button>
          </div>

          <div className="card overflow-hidden">
            {invitesLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-content-secondary">Loading invite links...</div>
            ) : invites.length === 0 ? (
              <div className="p-12 text-center text-content-secondary">
                <Link2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <h3 className="text-sm font-bold text-content-primary mb-1">No invite links generated</h3>
                <p className="text-xs">Generate an invite link to invite users to your platform.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invites.map((invite) => (
                  <div key={invite.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-slate-50/80 transition-colors">
                    {/* Status dot */}
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      invite.is_valid ? "bg-emerald-500" : "bg-slate-300"
                    )} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-content-primary truncate max-w-md bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                          {invite.invite_url}
                        </span>
                        {invite.is_valid ? (
                          <span className="badge badge-success font-bold text-[10px]">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-500 border-slate-200 font-bold text-[10px]">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-content-muted flex gap-4 mt-1 font-medium">
                        <span>Uses: {invite.use_count} / {invite.max_uses}</span>
                        <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(invite.id, invite.invite_url)}
                      className="btn-secondary h-9 px-3 text-xs font-bold min-h-[36px]"
                      title="Copy Invite URL"
                    >
                      {copiedId === invite.id ? (
                        <Check className="w-4 h-4 text-emerald-600 mr-1" />
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
