"use client";

import { useEffect, useState } from "react";
import { Grid3X3, Search, Loader2 } from "lucide-react";
import api from "@/lib/api";
import MovieCard from "@/components/media/MovieCard";
import type { Collection, Movie } from "@/types";

interface CollectionWithMovies extends Collection {
  movies: Movie[];
}

export default function LibraryPage() {
  const [collections, setCollections] = useState<CollectionWithMovies[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: cols } = await api.get<Collection[]>("/api/collections");
        
        // Fetch movies for each collection (in a real app, this might be a single aggregated endpoint)
        const collectionsWithMovies = await Promise.all(
          cols.map(async (col) => {
            const { data: movies } = await api.get<Movie[]>(`/api/movies?collection_id=${col.id}`);
            return { ...col, movies };
          })
        );
        
        setCollections(collectionsWithMovies);
      } catch (error) {
        console.error("Failed to load library:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
              <h2 className="section-title">{collection.name}</h2>
              {collection.movies.length > 6 && (
                <button className="btn-ghost text-xs py-1.5 px-3">See all</button>
              )}
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
