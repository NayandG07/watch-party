"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, HardDrive, Loader2, Check, Eye, EyeOff } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";

interface StorageProvider {
  id: string;
  name: string;
  provider_type: string;
  bucket_name: string;
  endpoint_url: string | null;
  cdn_url: string | null;
  is_active: boolean;
}

export default function StorageSettingsPage() {
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bucket_name: "",
    endpoint_url: "",
    cdn_url: "",
    key_id: "",
    application_key: "",
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const { data } = await api.get<StorageProvider[]>("/api/storage-providers");
      setProviders(data);
    } catch {
      setError("Failed to load storage providers");
    } finally {
      setIsLoading(false);
    }
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post("/api/storage-providers", {
        name: form.name,
        provider_type: "b2",
        bucket_name: form.bucket_name,
        endpoint_url: form.endpoint_url || null,
        cdn_url: form.cdn_url || null,
        credentials: {
          key_id: form.key_id,
          application_key: form.application_key,
        },
      });
      setSuccessMsg("Storage provider connected successfully!");
      setShowForm(false);
      setForm({ name: "", bucket_name: "", endpoint_url: "", cdn_url: "", key_id: "", application_key: "" });
      fetchProviders();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this storage provider?")) return;
    try {
      await api.delete(`/api/storage-providers/${id}`);
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to remove storage provider");
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">Storage Providers</h1>
          <p className="text-sm text-content-secondary mt-1">
            Connect your Backblaze B2 bucket to host media. Credentials are encrypted at rest.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary h-9 px-4 text-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Provider
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass p-6 rounded-2xl animate-fade-in">
          <h2 className="text-base font-semibold text-content-primary mb-5">Connect Backblaze B2 Bucket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-content-secondary">Display Name</label>
                <input
                  className="input"
                  placeholder="e.g. My B2 Movies"
                  required
                  value={form.name}
                  onChange={update("name")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-content-secondary">Bucket Name</label>
                <input
                  className="input"
                  placeholder="e.g. my-watch-party-bucket"
                  required
                  value={form.bucket_name}
                  onChange={update("bucket_name")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-content-secondary">Application Key ID</label>
                <input
                  className="input font-mono text-sm"
                  placeholder="00a1b2c3d4e5..."
                  required
                  value={form.key_id}
                  onChange={update("key_id")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-content-secondary">Application Key</label>
                <div className="relative">
                  <input
                    className="input font-mono text-sm pr-10"
                    placeholder="K001..."
                    required
                    type={showKey ? "text" : "password"}
                    value={form.application_key}
                    onChange={update("application_key")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-content-secondary">
                  Endpoint URL <span className="text-content-muted">(optional)</span>
                </label>
                <input
                  className="input"
                  placeholder="https://s3.us-west-004.backblazeb2.com"
                  value={form.endpoint_url}
                  onChange={update("endpoint_url")}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-content-secondary">
                  CDN URL <span className="text-content-muted">(optional — Cloudflare proxy)</span>
                </label>
                <input
                  className="input"
                  placeholder="https://cdn.yourdomain.com"
                  value={form.cdn_url}
                  onChange={update("cdn_url")}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isSubmitting} className="btn-primary h-9 px-5 text-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                {isSubmitting ? "Connecting…" : "Connect Bucket"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary h-9 px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {successMsg && (
        <div className="glass border border-success/30 bg-success/10 px-4 py-3 rounded-xl text-sm text-success flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Provider list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : providers.length === 0 ? (
        <div className="glass p-12 text-center text-content-secondary">
          <HardDrive className="w-12 h-12 mx-auto mb-4 text-brand-500/40" />
          <p className="text-sm">No storage providers connected yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="glass p-5 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5 text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-content-primary truncate">{p.name}</p>
                  <p className="text-xs text-content-muted truncate">
                    B2 · {p.bucket_name}
                    {p.cdn_url && ` · CDN: ${p.cdn_url}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-content-muted hover:text-danger transition-colors shrink-0"
                title="Remove provider"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
