"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Plus, MoreVertical, Globe, Lock, Users, Trash2, Library as LibraryIcon, Film } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import MovieCard from "@/components/media/MovieCard";
import type { Movie } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { CreateLibraryModal } from "@/components/library/CreateLibraryModal";
import { CreateCollectionModal } from "@/components/library/CreateCollectionModal";

// Inline type matching the new library-summary endpoint shape
interface LibraryOwner {
  id: string;
  username: string;
  role: string;
}

interface LibrarySummaryItem {
  id: string;
  library_id: string;
  name: string;
  description: string | null;
  visibility: string;
  poster_path: string | null;
  sort_order: number;
  movie_count: number;
  library: {
    id: string;
    name: string;
    is_private: boolean;
    owner: LibraryOwner;
  };
  movies: Movie[];
}

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [collections, setCollections] = useState<LibrarySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showCreateLibrary, setShowCreateLibrary] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Single endpoint: all visible collections + their movies — no waterfall
      const { data } = await api.get<LibrarySummaryItem[]>("/api/libraries/library-summary");
      setCollections(data);
    } catch (error) {
      console.error("Failed to load library:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);



  const canManageCollection = (col: LibrarySummaryItem) => {
    if (user?.role === "super_admin") return true;
    if (user?.role === "level2" && col.library?.owner?.id === user?.id) return true;
    return false;
  };

  const handleUpdateVisibility = async (collectionId: string, visibility: string) => {
    // Optimistic UI update
    setCollections((prev) => prev.map(c => c.id === collectionId ? { ...c, visibility } : c));
    setIsUpdating(collectionId);
    setOpenDropdown(null);
    try {
      await api.patch(`/api/collections/${collectionId}`, { visibility });
      // We can skip loadData() because we already optimistic updated, 
      // but running it in the background keeps state perfectly in sync without blocking the UI
      loadData();
    } catch (error) {
      console.error("Failed to update visibility:", error);
      alert("Failed to update visibility");
      loadData(); // revert optimistic update
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    setConfirmDeleteId(null);
    // Optimistic UI update
    setCollections((prev) => prev.filter(c => c.id !== collectionId));
    setIsUpdating(collectionId);
    setOpenDropdown(null);
    try {
      await api.delete(`/api/collections/${collectionId}`);
    } catch (error) {
      console.error("Failed to delete collection:", error);
      alert("Failed to delete collection");
      loadData(); // revert optimistic update
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateCollection = () => {
    setShowCreateCollection(true);
    setOpenDropdown(null);
  };

  const handleCreateLibrary = () => {
    setShowCreateLibrary(true);
    setOpenDropdown(null);
  };

  return (
    <>
      <div className="animate-fade-in">
        {/* Page header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">Library</h1>
          <p className="text-sm text-content-secondary mt-0.5">Browse your collections</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
            <input
              id="library-search"
              type="search"
              placeholder="Search…"
              className="input pl-9 w-48 focus:w-64 transition-all duration-300 h-9 text-sm"
            />
          </div>

          {/* Create Dropdown (Level 2+) */}
          {(user?.role === "level2" || user?.role === "super_admin") && (
            <div className="relative">
              <button 
                onClick={() => {
                  setOpenDropdown(openDropdown === "create" ? null : "create");
                }} 
                className="btn-primary h-9 px-3 gap-2 ml-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </button>

              {openDropdown === "create" && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl shadow-card border border-surface-border overflow-hidden w-48 animate-fade-in">
                    <button
                      onClick={() => handleCreateLibrary()}
                    className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-content-secondary hover:text-content-primary"
                  >
                    <LibraryIcon className="w-4 h-4" />
                    New Library
                  </button>
                  <button
                    onClick={() => handleCreateCollection()}
                    className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-content-secondary hover:text-content-primary"
                  >
                    <Plus className="w-4 h-4" />
                    New Collection
                  </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {isLoading ? (
        // Skeleton loader grid
        <div className="mb-10 space-y-4">
          <div className="h-6 w-40 rounded-lg bg-surface-elevated animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-surface-elevated" />
                <div className="mt-2 h-3.5 rounded bg-surface-elevated w-3/4" />
                <div className="mt-1.5 h-3 rounded bg-surface-elevated w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-20 text-content-secondary flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/10">
            <Film className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-medium text-content-primary mb-2">No collections yet</h3>
          <p>Your library is empty. Collections will appear here once they are created.</p>
        </div>
      ) : (
        collections.map((collection) => (
          <section key={collection.id} className="mb-10 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="section-title flex items-baseline gap-2">
                  {collection.name}
                  {collection.library?.owner?.id !== user?.id && (
                    <span className="text-content-muted text-sm font-normal">by {collection.library?.owner?.username}</span>
                  )}
                </h2>
                {/* Visibility Badge */}
                {collection.visibility === "shared" && (
                  <span title="Shared"><Globe className="w-3.5 h-3.5 text-brand-400" /></span>
                )}
                {collection.visibility === "friends" && (
                  <span title="Friends Only"><Users className="w-3.5 h-3.5 text-brand-500 dark:text-brand-300" /></span>
                )}
                {collection.visibility === "private" && (
                  <span title="Private"><Lock className="w-3.5 h-3.5 text-content-muted" /></span>
                )}
              </div>

              <div className="flex items-center gap-2 relative">
                {collection.movies.length > 6 && (
                  <Link href={`/collection/${collection.id}`} className="btn-ghost text-xs py-1.5 px-3 rounded-md">See all</Link>
                )}

                {/* Edit Dropdown (owner or admin only) */}
                {canManageCollection(collection) && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setOpenDropdown(openDropdown === collection.id ? null : collection.id);
                        setConfirmDeleteId(null);
                      }}
                      disabled={isUpdating === collection.id}
                      className="btn-ghost p-1.5 text-content-secondary hover:text-content-primary"
                    >
                      {isUpdating === collection.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </button>

                    {openDropdown === collection.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => { setOpenDropdown(null); setConfirmDeleteId(null); }} />
                        <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl shadow-card border border-surface-border overflow-hidden w-48 animate-fade-in">
                          {confirmDeleteId === collection.id ? (
                            <div className="p-3 bg-danger/10 border-t border-danger/20">
                              <p className="text-xs text-danger mb-2 font-medium">Delete this collection?</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleDeleteCollection(collection.id)} className="btn-danger flex-1 h-7 text-xs px-2 rounded-md">Yes</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost flex-1 h-7 text-xs px-2 rounded-md bg-surface-elevated">No</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider bg-black/20">
                                Visibility
                              </div>
                              {["shared", "friends", "private"].map((vis) => (
                                <button
                                  key={vis}
                                  onClick={() => handleUpdateVisibility(collection.id, vis)}
                                  className={cn(
                                    "w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors",
                                    collection.visibility === vis ? "text-brand-400" : "text-content-secondary"
                                  )}
                                >
                                  {vis === "shared" && <Globe className="w-4 h-4" />}
                                  {vis === "friends" && <Users className="w-4 h-4" />}
                                  {vis === "private" && <Lock className="w-4 h-4" />}
                                  <span className="capitalize">{vis}</span>
                                </button>
                              ))}
                              <div className="h-px bg-surface-border my-1" />
                              <button
                                onClick={() => setConfirmDeleteId(collection.id)}
                                className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Collection
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {collection.movies.length === 0 ? (
              <p className="text-sm text-content-muted italic">This collection is empty.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {collection.movies.slice(0, 6).map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
      </div>

      {showCreateLibrary && (
        <CreateLibraryModal 
          onClose={() => setShowCreateLibrary(false)} 
          onSuccess={() => {
            setShowCreateLibrary(false);
            loadData();
          }} 
        />
      )}

      {showCreateCollection && (
        <CreateCollectionModal 
          onClose={() => setShowCreateCollection(false)} 
          onSuccess={() => {
            setShowCreateCollection(false);
            loadData();
          }} 
        />
      )}
    </>
  );
}
