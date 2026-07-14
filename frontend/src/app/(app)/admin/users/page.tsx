"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, Check, Users } from "lucide-react";
import api from "@/lib/api";

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

export default function AdminUsersPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      const { data } = await api.get<Invite[]>("/api/invites");
      setInvites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<Invite>("/api/invites", {});
      setInvites((prev) => [data, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content-primary">
            Invite Management
          </h1>
          <p className="text-content-secondary mt-1">
            Generate and manage invite links for your private cinema.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary"
        >
          {generating ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          Generate Link
        </button>
      </div>

      {/* Invites List */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-content-secondary">Loading invites...</div>
        ) : invites.length === 0 ? (
          <div className="p-12 text-center text-content-secondary">
            <Users className="w-12 h-12 mx-auto mb-4 text-brand-500/50" />
            <h3 className="text-lg font-medium text-content-primary mb-1">No invites generated</h3>
            <p className="text-sm">Generate an invite link to invite users to your server.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {invites.map((invite) => (
              <div key={invite.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm text-content-primary truncate max-w-sm">
                      {invite.invite_url}
                    </span>
                    {!invite.is_valid ? (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-danger/20 text-danger">Expired</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-success/20 text-success">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-content-muted flex gap-4">
                    <span>Uses: {invite.use_count} / {invite.max_uses}</span>
                    <span>Expires: {new Date(invite.expires_at).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(invite.id, invite.invite_url)}
                  className="p-2.5 rounded-xl hover:bg-surface-elevated text-content-secondary hover:text-content-primary transition-colors shrink-0"
                  title="Copy Link"
                >
                  {copiedId === invite.id ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
