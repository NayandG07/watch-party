"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { Collection } from "@/types";

interface EditCollectionModalProps {
  collection: Collection;
  onClose: () => void;
  onSuccess: (updatedCollection: Collection) => void;
}

export function EditCollectionModal({ collection, onClose, onSuccess }: EditCollectionModalProps) {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || "");
  const [visibility, setVisibility] = useState(collection.visibility);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await api.patch<Collection>(`/api/collections/${collection.id}`, {
        name,
        description: description || null,
        visibility,
      });
      onSuccess(data);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = err as any;
      setError(axiosError.response?.data?.detail || "Failed to update collection");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-elevated border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-content-primary">Edit Collection</h2>
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
            <label htmlFor="col-name" className="block text-sm font-medium text-content-secondary mb-1.5">
              Collection Name
            </label>
            <input
              id="col-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className="input w-full h-20 resize-none py-2"
            />
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
              <option value="public">Public (Everyone with access to the library)</option>
            </select>
          </div>

          <footer className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary h-10 px-4">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary h-10 px-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
