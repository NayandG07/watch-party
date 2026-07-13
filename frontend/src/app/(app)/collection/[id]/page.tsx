"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";
import MovieCard from "@/components/media/MovieCard";
import type { Collection, Movie } from "@/types";

export default function CollectionPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [colRes, moviesRes] = await Promise.all([
          api.get<Collection>(`/api/collections/${id}`),
          api.get<Movie[]>(`/api/movies?collection_id=${id}`),
        ]);
        
        setCollection(colRes.data);
        setMovies(moviesRes.data);
      } catch {
        setError("Failed to load collection");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="text-center py-20 text-content-secondary">
        <p>{error || "Collection not found"}</p>
        <button onClick={() => router.back()} className="mt-4 btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-content-muted hover:text-content-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary">{collection.name}</h1>
        {collection.description && (
          <p className="text-content-secondary mt-2 max-w-2xl">{collection.description}</p>
        )}
        <p className="text-xs text-content-muted mt-2">{movies.length} titles</p>
      </header>

      {movies.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl border-dashed">
          <p className="text-content-secondary">This collection is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
