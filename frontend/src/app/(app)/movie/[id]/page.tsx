"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play, Users, Clock, Calendar, Tv } from "lucide-react";
import api from "@/lib/api";
import type { Movie } from "@/types";
import { formatDuration } from "@/lib/utils";

export default function MoviePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data } = await api.get<Movie>(`/api/movies/${id}`);
        setMovie(data);
      } catch (err) {
        setError("Failed to load movie details");
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
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-center py-20 text-content-secondary">
        <p>{error || "Movie not found"}</p>
        <button onClick={() => router.back()} className="mt-4 btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-6 -mt-6 sm:mx-0 sm:mt-0 pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full aspect-video md:aspect-[21/9] max-h-[70vh] bg-surface-raised sm:rounded-3xl overflow-hidden shadow-2xl">
        {movie.backdrop_url ? (
          <img 
            src={movie.backdrop_url} 
            alt={movie.title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-brand opacity-30" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-base via-surface-base/40 to-transparent" />
        
        {/* Back button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Content overlaid on backdrop */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-10">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/90 mb-6 drop-shadow-md">
              {movie.year && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-300" />
                  {movie.year}
                </div>
              )}
              {movie.duration_seconds > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-300" />
                  {formatDuration(movie.duration_seconds)}
                </div>
              )}
              {movie.resolution && (
                <div className="flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-brand-300" />
                  <span className="uppercase">{movie.resolution}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => router.push(`/room/new?movie=${movie.id}`)}
                className="btn-primary h-12 px-6 sm:px-8 shadow-lg shadow-brand-500/25 group"
              >
                <Users className="w-5 h-5 mr-2" />
                Host Party
              </button>
              
              {/* Optional secondary play button if we add solo watch mode */}
              <button 
                className="btn-secondary h-12 px-6 sm:px-8 bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10"
              >
                <Play className="w-5 h-5 mr-2" />
                Solo Watch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 px-6 sm:px-4 max-w-6xl mx-auto">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Synopsis</h2>
            <p className="text-content-secondary leading-relaxed text-lg">
              {/* For now, just a placeholder or description if available */}
              {/* Note: backend schema has `description` but the frontend Movie interface didn't include it. 
                  We should update the Movie interface to include description, but for now we'll just check if it exists via casting. */}
              {(movie as any).description || "No synopsis available for this title."}
            </p>
          </section>
        </div>
        
        <div>
          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-medium text-content-muted uppercase tracking-wider mb-4">
              Info
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-content-secondary">Status</span>
                <span className="font-medium text-content-primary">
                  {movie.is_processed ? "Ready" : "Processing"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-content-secondary">Uploaded</span>
                <span className="font-medium text-content-primary">
                  {movie.is_uploaded ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
