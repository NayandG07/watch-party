"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Plus, MoreVertical, Globe, Lock, Users, Trash2, Library as LibraryIcon, Film, Play, HardDrive, Clock } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import MovieCard from "@/components/media/MovieCard";
import type { Movie } from "@/types";
import { useAuthStore } from "@/stores/authStore";
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

interface ActiveSession {
  id: string;
  name: string;
  position_seconds: number;
  movie?: {
    id: string;
    title: string;
    duration_seconds: number;
    backdrop_url?: string;
  } | null;
}

type FilterType = "all" | "movies" | "series" | "recently_added";

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [collections, setCollections] = useState<LibrarySummaryItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // UI State
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showCreateLibrary, setShowCreateLibrary] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryRes, roomsRes] = await Promise.allSettled([
        api.get<LibrarySummaryItem[]>("/api/libraries/library-summary"),
        api.get<ActiveSession[]>("/api/rooms"),
      ]);

      if (summaryRes.status === "fulfilled") {
        setCollections(summaryRes.value.data);
      }
      if (roomsRes.status === "fulfilled") {
        setActiveSessions(roomsRes.value.data.filter((r) => r.movie));
      }
    } catch (error) {
      console.error("Failed to load library data:", error);
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
    setCollections((prev) => prev.map(c => c.id === collectionId ? { ...c, visibility } : c));
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
    setCollections((prev) => prev.filter(c => c.id !== collectionId));
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

  // Filter collections and movies based on search & tab
  const getFilteredCollections = () => {
    return collections.map((col) => {
      let movies = col.movies;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        movies = movies.filter((m) => m.title.toLowerCase().includes(q));
      }

      if (activeFilter === "recently_added") {
        movies = [...movies].reverse();
      }

      return { ...col, movies };
    }).filter((col) => col.movies.length > 0 || !searchQuery);
  };

  const filteredCollections = getFilteredCollections();
  const totalMovies = collections.reduce((acc, c) => acc + c.movies.length, 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-neutral-800">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Library</h1>
          <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">Browse collections and pick media for your watch party.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-zinc-500" />
            <input
              id="library-search"
              type="search"
              placeholder="Search titles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-stone-50 dark:bg-neutral-900/40 border border-stone-200 dark:border-neutral-800 rounded-lg text-xs text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Create Button (Level 2+) */}
          {(user?.role === "level2" || user?.role === "super_admin") && (
            <div className="relative">
              <button 
                onClick={() => setOpenDropdown(openDropdown === "create" ? null : "create")} 
                className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl flex items-center gap-2 shrink-0 transition-transform active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>

              {openDropdown === "create" && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-neutral-950 rounded-xl shadow-2xl border border-stone-200 dark:border-neutral-900 overflow-hidden w-52 animate-fade-in py-1">
                    <button
                      onClick={() => { setShowCreateLibrary(true); setOpenDropdown(null); }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors text-stone-800 dark:text-zinc-200 font-medium"
                    >
                      <LibraryIcon className="w-4 h-4 text-amber-500" />
                      New Library
                    </button>
                    <button
                      onClick={() => { setShowCreateCollection(true); setOpenDropdown(null); }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors text-stone-800 dark:text-zinc-200 font-medium"
                    >
                      <Plus className="w-4 h-4 text-amber-500" />
                      New Collection
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["all", "movies", "series", "recently_added"] as FilterType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap min-h-[32px]",
              activeFilter === tab
                ? "bg-amber-500/15 text-amber-500 font-bold"
                : "text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200"
            )}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Prominent Continue Watching Section */}
      {activeSessions.length > 0 && (
        <section className="space-y-4 bg-white dark:bg-neutral-950/40 p-6 rounded-2xl border border-stone-200 dark:border-neutral-900 shadow-xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500/80 via-yellow-400 to-emerald-500/80" />
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Continue Watching
            </h2>
            <Link href="/rooms" className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 hover:text-amber-600 flex items-center gap-1">
              All Rooms →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeSessions.slice(0, 3).map((session) => (
              <Link
                key={session.id}
                href={`/room/${session.id}`}
                className="group flex items-center gap-4 p-3 rounded-xl bg-stone-50 dark:bg-neutral-900/50 border border-stone-200 dark:border-neutral-800 hover:border-amber-500/50 hover:bg-stone-100 dark:hover:bg-neutral-800/50 transition-all"
              >
                <div className="w-16 h-20 rounded-lg bg-stone-200 dark:bg-neutral-800 overflow-hidden shrink-0 relative border border-stone-200 dark:border-neutral-700">
                  {session.movie?.backdrop_url ? (
                    <img src={session.movie.backdrop_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-200 dark:bg-neutral-800">
                      <Film className="w-6 h-6 text-stone-400 dark:text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Active Party</span>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 truncate mt-1">{session.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">{session.movie?.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm text-stone-500 dark:text-zinc-400 font-medium">Loading your media library…</p>
        </div>
      ) : totalMovies === 0 && collections.length === 0 ? (
        /* Strong Empty State */
        <div className="bg-white dark:bg-neutral-950/40 rounded-2xl border border-stone-200 dark:border-neutral-900 p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xl my-12">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
            <HardDrive className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white mb-2">Your library is empty</h2>
            <p className="text-sm text-stone-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Connect a cloud storage provider (like Backblaze B2) or create your first collection to start adding titles.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(user?.role === "level2" || user?.role === "super_admin") && (
              <Link href="/admin/settings/storage" className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl flex items-center justify-center transition-transform active:scale-[0.98]">
                Connect Storage
              </Link>
            )}
            <button
              onClick={() => setShowCreateCollection(true)}
              className="bg-white/10 hover:bg-white/20 text-stone-800 dark:text-white border border-stone-300 dark:border-white/10 backdrop-blur-sm h-11 px-6 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Create Collection
            </button>
          </div>
        </div>
      ) : (
        /* Collections Shelves */
        filteredCollections.map((collection) => (
          <section key={collection.id} className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  {collection.name}
                  {collection.library?.owner?.username && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                      by {collection.library.owner.username}
                    </span>
                  )}
                </h2>
                {collection.visibility === "shared" && (
                  <span className="badge-brand" title="Shared with all"><Globe className="w-3 h-3" /> Shared</span>
                )}
                {collection.visibility === "friends" && (
                  <span className="badge-accent" title="Friends Only"><Users className="w-3 h-3" /> Friends</span>
                )}
                {collection.visibility === "private" && (
                  <span className="badge-neutral" title="Private"><Lock className="w-3 h-3" /> Private</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {collection.movies.length > 6 && (
                  <Link href={`/collection/${collection.id}`} className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 hover:text-amber-500 px-3">
                    See all ({collection.movies.length})
                  </Link>
                )}

                {canManageCollection(collection) && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === collection.id ? null : collection.id)}
                      disabled={isUpdating === collection.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
                      aria-label="Collection menu"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openDropdown === collection.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                        <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-neutral-950 rounded-xl shadow-2xl border border-stone-200 dark:border-neutral-900 overflow-hidden w-48 animate-fade-in py-1">
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 bg-stone-50 dark:bg-neutral-900/50">
                            Visibility
                          </div>
                          {["shared", "friends", "private"].map((vis) => (
                            <button
                              key={vis}
                              onClick={() => handleUpdateVisibility(collection.id, vis)}
                              className={cn(
                                "w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors",
                                collection.visibility === vis ? "text-amber-500 font-bold" : "text-stone-600 dark:text-zinc-400"
                              )}
                            >
                              <span className="capitalize">{vis}</span>
                            </button>
                          ))}
                          <div className="h-px bg-stone-200 dark:bg-neutral-800 my-1" />
                          <button
                            onClick={() => handleDeleteCollection(collection.id)}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Collection
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {collection.movies.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-zinc-500 italic bg-stone-50 dark:bg-neutral-900/30 p-6 rounded-xl border border-stone-200 dark:border-neutral-800/50">This collection has no movies yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {collection.movies.slice(0, 6).map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>
            )}
          </section>
        ))
      )}

      {showCreateLibrary && (
        <CreateLibraryModal 
          onClose={() => setShowCreateLibrary(false)} 
          onSuccess={() => { setShowCreateLibrary(false); loadData(); }} 
        />
      )}

      {showCreateCollection && (
        <CreateCollectionModal 
          onClose={() => setShowCreateCollection(false)} 
          onSuccess={() => { setShowCreateCollection(false); loadData(); }} 
        />
      )}
    </div>
  );
}
