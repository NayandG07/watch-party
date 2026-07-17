"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Library as LibraryIcon } from "lucide-react";
import api from "@/lib/api";
import { Library } from "@/types";

interface CreateCollectionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCollectionModal({ onClose, onSuccess }: CreateCollectionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [libraryId, setLibraryId] = useState("");
  
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoadingLibraries, setIsLoadingLibraries] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchLibraries() {
      try {
        const { data } = await api.get<Library[]>("/api/libraries");
        setLibraries(data);
        if (data.length > 0) {
          setLibraryId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load libraries", err);
      } finally {
        setIsLoadingLibraries(false);
      }
    }
    fetchLibraries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !libraryId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post("/api/collections", {
        name,
        description: description || null,
        visibility,
        library_id: libraryId,
      });
      onSuccess();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = err as any;
      setError(axiosError.response?.data?.detail || "Failed to create collection");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-elevated border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-content-primary">Create New Collection</h2>
          <button onClick={onClose} className="text-content-muted hover:text-content-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
             <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {typeof error === 'string' ? error : (Array.isArray(error) ? error.map((e: any) => e.msg || JSON.stringify(e)).join(", ") : JSON.stringify(error))}
            </div>
          )}

          <div>
            <label htmlFor="col-name" className="block text-sm font-medium text-content-secondary mb-1.5">
              Collection Name
            </label>
            <input
              id="col-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Action Movies"
              className="input w-full"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="col-desc" className="block text-sm font-medium text-content-secondary mb-1.5">
              Description <span className="text-content-muted font-normal">(Optional)</span>
            </label>
            <textarea
              id="col-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in this collection?"
              className="input w-full h-20 resize-none py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1.5">
              Parent Library
            </label>
            {isLoadingLibraries ? (
              <div className="flex items-center gap-2 text-sm text-content-muted h-10 px-3 bg-surface-base rounded-lg border border-surface-border">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading libraries...
              </div>
            ) : libraries.length === 0 ? (
              <div className="text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20 flex gap-2">
                <LibraryIcon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">No libraries found.</p>
                  <p className="text-xs mt-1 text-amber-400/80">You must create a library before creating a collection.</p>
                </div>
              </div>
            ) : (
              <select
                value={libraryId}
                onChange={(e) => setLibraryId(e.target.value)}
                required
                className="input w-full appearance-none"
              >
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1.5">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="input w-full appearance-none"
            >
              <option value="private">Private (Only you)</option>
              <option value="friends">Friends (Selected users)</option>
              <option value="shared">Shared (Everyone with access to the library)</option>
            </select>
            <p className="text-xs text-content-muted mt-1.5">
              Collections inherit their parent library&apos;s maximum visibility. A public collection in a private library remains private.
            </p>
          </div>

          <footer className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary h-10 px-4">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary h-10 px-6"
              disabled={isSubmitting || libraries.length === 0}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Collection"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
