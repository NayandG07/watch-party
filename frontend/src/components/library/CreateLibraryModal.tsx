"use client";

import { useState, useEffect } from "react";
import { X, Loader2, HardDrive } from "lucide-react";
import api from "@/lib/api";

interface StorageProvider {
  id: string;
  name: string;
  bucket_name: string;
}

interface CreateLibraryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLibraryModal({ onClose, onSuccess }: CreateLibraryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [providerId, setProviderId] = useState("");
  
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const { data } = await api.get<StorageProvider[]>("/api/storage-providers");
        setProviders(data);
        if (data.length > 0) {
          setProviderId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load providers", err);
      } finally {
        setIsLoadingProviders(false);
      }
    }
    fetchProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !providerId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post("/api/libraries", {
        name,
        description: description || null,
        is_private: isPrivate,
        storage_provider_id: providerId,
      });
      onSuccess();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = err as any;
      setError(axiosError.response?.data?.detail || "Failed to create library");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-elevated border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-content-primary">Create New Library</h2>
          <button onClick={onClose} className="text-content-muted hover:text-content-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
             <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="lib-name" className="block text-sm font-medium text-content-secondary mb-1.5">
              Library Name
            </label>
            <input
              id="lib-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Movies, TV Shows"
              className="input w-full"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="lib-desc" className="block text-sm font-medium text-content-secondary mb-1.5">
              Description <span className="text-content-muted font-normal">(Optional)</span>
            </label>
            <textarea
              id="lib-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in this library?"
              className="input w-full h-20 resize-none py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1.5">
              Storage Provider
            </label>
            {isLoadingProviders ? (
              <div className="flex items-center gap-2 text-sm text-content-muted h-10 px-3 bg-surface-base rounded-lg border border-surface-border">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading providers...
              </div>
            ) : providers.length === 0 ? (
              <div className="text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20 flex gap-2">
                <HardDrive className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">No storage providers found.</p>
                  <p className="text-xs mt-1 text-amber-400/80">You must configure a storage provider in Settings first.</p>
                </div>
              </div>
            ) : (
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                required
                className="input w-full appearance-none"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.bucket_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="pt-0.5">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-surface-border bg-surface-base text-brand-500 focus:ring-brand-500 focus:ring-offset-surface-elevated transition-colors cursor-pointer"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-content-primary group-hover:text-brand-300 transition-colors">
                Private Library
              </p>
              <p className="text-xs text-content-muted mt-0.5">
                If checked, only you can see this library. If unchecked, it will be visible to your friends.
              </p>
            </div>
          </label>

          <footer className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary h-10 px-4">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary h-10 px-6"
              disabled={isSubmitting || providers.length === 0}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Library"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
