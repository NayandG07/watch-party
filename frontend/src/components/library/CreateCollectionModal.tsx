"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Library as LibraryIcon, Users, Check, Search, Lock, Globe } from "lucide-react";
import api from "@/lib/api";
import { Library } from "@/types";
import { cn } from "@/lib/utils";

interface SelectableUser {
  id: string;
  username: string;
  email?: string;
  role: string;
}

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

  // Friends selection state
  const [selectableUsers, setSelectableUsers] = useState<SelectableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

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

  useEffect(() => {
    if (visibility === "friends" && selectableUsers.length === 0) {
      setIsLoadingUsers(true);
      api
        .get<SelectableUser[]>("/api/users/selectable")
        .then(({ data }) => setSelectableUsers(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Failed to load users", err))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [visibility, selectableUsers.length]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUserIds(selectableUsers.map((u) => u.id));
  };

  const handleClearAll = () => {
    setSelectedUserIds([]);
  };

  const filteredUsers = selectableUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q));
  });

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
        selected_user_ids: visibility === "friends" ? selectedUserIds : [],
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
            <label className="block text-sm font-medium text-content-secondary mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                  visibility === "private"
                    ? "bg-brand-500/15 border-brand-500 text-brand-400 font-semibold shadow-sm"
                    : "bg-surface-base border-surface-border text-content-secondary hover:text-content-primary hover:border-surface-border/80"
                )}
                id="visibility-private-btn"
              >
                <Lock className="w-4 h-4 mb-1" />
                <span className="text-xs">Private</span>
                <span className="text-[10px] text-content-muted mt-0.5">Only you</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("friends")}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                  visibility === "friends"
                    ? "bg-brand-500/15 border-brand-500 text-brand-400 font-semibold shadow-sm"
                    : "bg-surface-base border-surface-border text-content-secondary hover:text-content-primary hover:border-surface-border/80"
                )}
                id="visibility-friends-btn"
              >
                <Users className="w-4 h-4 mb-1" />
                <span className="text-xs">Friends</span>
                <span className="text-[10px] text-content-muted mt-0.5">Pick users</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("shared")}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                  visibility === "shared"
                    ? "bg-brand-500/15 border-brand-500 text-brand-400 font-semibold shadow-sm"
                    : "bg-surface-base border-surface-border text-content-secondary hover:text-content-primary hover:border-surface-border/80"
                )}
                id="visibility-shared-btn"
              >
                <Globe className="w-4 h-4 mb-1" />
                <span className="text-xs">Shared</span>
                <span className="text-[10px] text-content-muted mt-0.5">Library all</span>
              </button>
            </div>
            <p className="text-xs text-content-muted mt-2">
              Collections inherit their parent library&apos;s maximum visibility. A public collection in a private library remains private.
            </p>
          </div>

          {visibility === "friends" && (
            <div className="space-y-2 p-3 bg-surface-base rounded-xl border border-surface-border animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-400" /> Select Friends
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-brand-400">
                    {selectedUserIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] text-content-secondary hover:text-content-primary hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-content-muted text-[10px]">·</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] text-content-secondary hover:text-content-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="input pl-8 py-1.5 text-xs h-8 bg-surface-elevated"
                />
              </div>

              {/* Scrollable user list */}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-surface-border/40">
                {isLoadingUsers ? (
                  <div className="py-4 text-center text-xs text-content-muted flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                    Loading user directory...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-content-muted">
                    {selectableUsers.length === 0 ? "No other users found." : "No users match your search."}
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-lg text-left transition-all text-xs pt-1.5",
                          isSelected
                            ? "bg-brand-500/10 border border-brand-500/30 text-content-primary"
                            : "hover:bg-surface-elevated text-content-secondary border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {u.username[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-content-primary truncate leading-tight">
                              {u.username}
                            </p>
                            {u.email && (
                              <p className="text-[10px] text-content-muted truncate leading-tight mt-0.5">
                                {u.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-elevated text-content-muted">
                            {u.role}
                          </span>
                          <div
                            className={cn(
                              "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                              isSelected
                                ? "bg-brand-500 border-brand-500 text-white"
                                : "border-surface-border bg-surface-base"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

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
