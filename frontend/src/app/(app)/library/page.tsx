"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Loader2, Plus, MoreVertical, Globe, Lock, Users, Trash2, Library as LibraryIcon, Film, Folder, Sun, Moon } from "lucide-react";
import api from "@/lib/api";
import HeroSpotlight from "@/components/library/HeroSpotlight";
import HorizontalMovieLane from "@/components/library/HorizontalMovieLane";
import type { Movie } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";
import { CreateLibraryModal } from "@/components/library/CreateLibraryModal";
import { CreateCollectionModal } from "@/components/library/CreateCollectionModal";

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
  const { currentMode, toggleMode } = useThemeStore();
  const [collections, setCollections] = useState<LibrarySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "has_movies" | "mine">("all");

  // UI State
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showCreateLibrary, setShowCreateLibrary] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
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

  // Featured Movie for Spotlight Banner
  const allMovies = useMemo(() => {
    const list: Movie[] = [];
    const seen = new Set<string>();
    for (const c of collections) {
      for (const m of c.movies) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          list.push(m);
        }
      }
    }
    return list;
  }, [collections]);

  const featuredMovie = useMemo(() => {
    if (allMovies.length === 0) return null;
    return allMovies.find((m) => m.poster_url || m.backdrop_url) || allMovies[0];
  }, [allMovies]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCollection = c.name.toLowerCase().includes(query);
        const matchesMovies = c.movies.some((m) => m.title.toLowerCase().includes(query));
        if (!matchesCollection && !matchesMovies) return false;
      }

      // Tab filter
      if (activeFilter === "has_movies" && c.movies.length === 0) return false;
      if (activeFilter === "mine" && c.library?.owner?.id !== user?.id) return false;

      return true;
    });
  }, [collections, searchQuery, activeFilter, user?.id]);

  const canManageCollection = (col: LibrarySummaryItem) => {
    if (user?.role === "super_admin") return true;
    if (user?.role === "level2" && col.library?.owner?.id === user?.id) return true;
    return false;
  };

  const handleUpdateVisibility = async (collectionId: string, visibility: string) => {
    setCollections((prev) => prev.map((c) => (c.id === collectionId ? { ...c, visibility } : c)));
    setIsUpdating(collectionId);
    setOpenDropdown(null);
    try {
      await api.patch(`/api/collections/${collectionId}`, { visibility });
      loadData();
    } catch (error) {
      console.error("Failed to update visibility:", error);
      loadData();
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    setConfirmDeleteId(null);
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    setIsUpdating(collectionId);
    setOpenDropdown(null);
    try {
      await api.delete(`/api/collections/${collectionId}`);
    } catch (error) {
      console.error("Failed to delete collection:", error);
      loadData();
    } finally {
      setIsUpdating(null);
    }
  };

  const collectionsWithMovies = filteredCollections.filter((c) => c.movies.length > 0);
  const emptyCollections = filteredCollections.filter((c) => c.movies.length === 0);

  return (
    <>
      <div className="animate-fade-in space-y-6">
        {/* Page header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
              Media Library
            </h1>
            <p className="text-sm text-content-secondary mt-0.5">
              Explore private synchronized collections and watch party rooms.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <input
                id="library-search"
                type="search"
                placeholder="Search movies & collections…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 w-full sm:w-56 focus:sm:w-72 transition-all duration-300 h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Quick Sun/Moon toggle */}
            <button
              onClick={toggleMode}
              className="btn-ghost h-9 px-2.5 rounded-xl border border-surface-border text-content-secondary hover:text-content-primary shrink-0 transition-colors shadow-sm"
              title={currentMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle dark/light mode"
              id="library-mode-toggle"
            >
              {currentMode === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Create Dropdown (Level 2+) */}
            {(user?.role === "level2" || user?.role === "super_admin") && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "create" ? null : "create")}
                  className="btn-primary h-9 px-3 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create</span>
                </button>

                {openDropdown === "create" && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl shadow-card border border-surface-border overflow-hidden w-48 animate-fade-in">
                      <button
                        onClick={() => {
                          setShowCreateLibrary(true);
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-content-secondary hover:text-content-primary"
                      >
                        <LibraryIcon className="w-4 h-4" />
                        New Library
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateCollection(true);
                          setOpenDropdown(null);
                        }}
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0",
              activeFilter === "all"
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                : "bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border"
            )}
          >
            All Collections ({collections.length})
          </button>
          <button
            onClick={() => setActiveFilter("has_movies")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0",
              activeFilter === "has_movies"
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                : "bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border"
            )}
          >
            Ready to Watch ({allMovies.length} titles)
          </button>
          <button
            onClick={() => setActiveFilter("mine")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0",
              activeFilter === "mine"
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                : "bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border"
            )}
          >
            My Collections
          </button>
        </div>

        {/* Hero Spotlight Banner */}
        {!searchQuery && <HeroSpotlight movie={featuredMovie} />}

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-6 w-40 rounded-lg bg-surface-elevated animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] rounded-2xl bg-surface-elevated" />
                  <div className="mt-2 h-3.5 rounded bg-surface-elevated w-3/4" />
                  <div className="mt-1.5 h-3 rounded bg-surface-elevated w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-20 text-content-secondary flex flex-col items-center justify-center glass rounded-2xl p-8 border border-surface-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4 shadow-brand text-white">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-content-primary mb-1">No collections match your filter</h3>
            <p className="text-sm max-w-sm">Try clearing your search query or create a new collection to start streaming.</p>
          </div>
        ) : (
          <>
            {/* Horizontal Carousels for Collections with Movies */}
            {collectionsWithMovies.map((collection) => (
              <HorizontalMovieLane
                key={collection.id}
                title={collection.name}
                subtitle={
                  collection.library?.owner?.id !== user?.id
                    ? `Curated by ${collection.library?.owner?.username}`
                    : undefined
                }
                movies={collection.movies}
                extraHeader={
                  <div className="flex items-center gap-2">
                    {/* Visibility Badge */}
                    {collection.visibility === "shared" && (
                      <span title="Shared" className="text-brand-400 p-1">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {collection.visibility === "friends" && (
                      <span title="Friends Only" className="text-blue-400 p-1">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {collection.visibility === "private" && (
                      <span title="Private" className="text-content-muted p-1">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {/* Manage Dropdown */}
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
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setOpenDropdown(null);
                                setConfirmDeleteId(null);
                              }}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl shadow-card border border-surface-border overflow-hidden w-48 animate-fade-in">
                              {confirmDeleteId === collection.id ? (
                                <div className="p-3 bg-danger/10 border-t border-danger/20">
                                  <p className="text-xs text-danger mb-2 font-medium">
                                    Delete this collection?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDeleteCollection(collection.id)}
                                      className="btn-danger flex-1 h-7 text-xs px-2 rounded-md"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="btn-ghost flex-1 h-7 text-xs px-2 rounded-md bg-surface-elevated"
                                    >
                                      No
                                    </button>
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
                                        "w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 transition-colors",
                                        collection.visibility === vis
                                          ? "text-brand-400 font-semibold"
                                          : "text-content-secondary"
                                      )}
                                    >
                                      {vis === "shared" && <Globe className="w-3.5 h-3.5" />}
                                      {vis === "friends" && <Users className="w-3.5 h-3.5" />}
                                      {vis === "private" && <Lock className="w-3.5 h-3.5" />}
                                      <span className="capitalize">{vis}</span>
                                    </button>
                                  ))}
                                  <div className="h-px bg-surface-border my-1" />
                                  <button
                                    onClick={() => setConfirmDeleteId(collection.id)}
                                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-red-500/10 text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                }
              />
            ))}

            {/* Empty Collections Section (Compact, non-intrusive) */}
            {emptyCollections.length > 0 && (
              <section className="pt-6 border-t border-surface-border">
                <div className="flex items-center gap-2 mb-4">
                  <Folder className="w-4 h-4 text-content-muted" />
                  <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    Empty Collections ({emptyCollections.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {emptyCollections.map((collection) => (
                    <div
                      key={collection.id}
                      className="p-4 rounded-2xl bg-surface-elevated/40 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-semibold text-content-primary truncate">
                          {collection.name}
                        </p>
                        <p className="text-xs text-content-muted mt-0.5">
                          {collection.library?.owner?.id !== user?.id
                            ? `by ${collection.library?.owner?.username}`
                            : "0 movies"}
                        </p>
                      </div>

                      {canManageCollection(collection) && (
                        <button
                          onClick={() => handleDeleteCollection(collection.id)}
                          className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-content-muted hover:text-red-400 flex items-center justify-center transition-all"
                          title="Delete collection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
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
