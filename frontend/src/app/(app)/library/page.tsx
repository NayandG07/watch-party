"use client";

import { useEffect, useState, useCallback } from "react";
import { Grid3X3, Search, Loader2, Plus, MoreVertical, Globe, Lock, Users, Trash2 } from "lucide-react";
import api from "@/lib/api";
import MovieCard from "@/components/media/MovieCard";
import type { Movie } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick() {
      setOpenDropdown(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const canManageCollection = (col: LibrarySummaryItem) => {
    if (user?.role === "super_admin") return true;
    if (user?.role === "level2" && col.library?.owner?.id === user?.id) return true;
    return false;
  };

  const handleUpdateVisibility = async (collectionId: string, visibility: string) => {
    setIsUpdating(collectionId);
    setOpenDropdown(null);
    try {
      await api.patch(`/api/collections/${collectionId}`, { visibility });
      await loadData();
    } catch (error) {
      console.error("Failed to update visibility:", error);
      alert("Failed to update visibility");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!window.confirm("Are you sure you want to delete this collection? This action cannot be undone.")) return;
    setIsUpdating(collectionId);
    setOpenDropdown(null);
    try {
      await api.delete(`/api/collections/${collectionId}`);
      await loadData();
    } catch (error) {
      console.error("Failed to delete collection:", error);
      alert("Failed to delete collection");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateCollection = () => {
    alert("Collection creation modal coming soon!");
  };

  return (
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
          {/* View toggle */}
          <button className="btn-secondary h-9 px-3" aria-label="Grid view">
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Create Button (Level 2+) */}
          {(user?.role === "level2" || user?.role === "super_admin") && (
            <button onClick={handleCreateCollection} className="btn-primary h-9 px-3 gap-2 ml-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Collection</span>
            </button>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-20 text-content-secondary">
          <p>No collections found in your library.</p>
        </div>
      ) : (
        collections.map((collection) => (
          <section key={collection.id} className="mb-10 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="section-title">{collection.name}</h2>
                {/* Visibility Badge */}
                {collection.visibility === "public" && <Globe className="w-3.5 h-3.5 text-brand-400" title="Public" />}
                {collection.visibility === "friends" && <Users className="w-3.5 h-3.5 text-blue-400" title="Friends Only" />}
                {collection.visibility === "private" && <Lock className="w-3.5 h-3.5 text-content-muted" title="Private" />}
              </div>

              <div className="flex items-center gap-2 relative">
                {collection.movies.length > 6 && (
                  <button className="btn-ghost text-xs py-1.5 px-3">See all</button>
                )}

                {/* Edit Dropdown (owner or admin only) */}
                {canManageCollection(collection) && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === collection.id ? null : collection.id);
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
                      <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl shadow-card border border-surface-border overflow-hidden w-48 animate-fade-in">
                        <div className="px-3 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider bg-black/20">
                          Visibility
                        </div>
                        {["public", "friends", "private"].map((vis) => (
                          <button
                            key={vis}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateVisibility(collection.id, vis);
                            }}
                            className={cn(
                              "w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors",
                              collection.visibility === vis ? "text-brand-400" : "text-content-secondary"
                            )}
                          >
                            {vis === "public" && <Globe className="w-4 h-4" />}
                            {vis === "friends" && <Users className="w-4 h-4" />}
                            {vis === "private" && <Lock className="w-4 h-4" />}
                            <span className="capitalize">{vis}</span>
                          </button>
                        ))}
                        <div className="h-px bg-surface-border my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(collection.id);
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Collection
                        </button>
                      </div>
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
  );
}
