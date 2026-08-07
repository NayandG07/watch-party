"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play, Users, Clock, Calendar, Tv, Film, ListVideo } from "lucide-react";
import api from "@/lib/api";
import type { Movie } from "@/types";
import { formatDuration } from "@/lib/utils";

export default function MoviePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data } = await api.get<Movie>(`/api/movies/${id}`);
        setMovie(data);
      } catch {
        setError("Failed to load movie details");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  const handleCreateRoom = async () => {
    if (!movie) return;
    setIsCreatingRoom(true);
    try {
      const { data } = await api.post("/api/rooms", {
        name: `${movie.title} Party`,
        movie_id: movie.id,
      });
      router.push(`/room/${data.id}`);
    } catch {
      setError("Failed to create room");
      setIsCreatingRoom(false);
    }
  };

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
        <button onClick={() => router.push("/library")} className="mt-4 btn-secondary">
          Go to Library
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full aspect-[21/9] max-h-[60vh] min-h-[320px] bg-surface-raised sm:rounded-3xl overflow-hidden shadow-2xl">
        {movie.backdrop_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
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
          onClick={() => router.push("/library")}
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
            
            <div className="hidden md:flex flex-wrap gap-4">
              <button 
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                className="btn-primary h-12 px-6 sm:px-8 shadow-lg shadow-brand-500/25 group"
              >
                {isCreatingRoom ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Users className="w-5 h-5 mr-2" />
                )}
                Host Party
              </button>
              
              <button 
                onClick={() => router.push(`/watch/${movie.id}`)}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12 px-6 sm:px-4 max-w-6xl mx-auto">
        
        {/* Poster - hidden on mobile */}
        <div className="hidden md:block col-span-1">
          <div className="sticky top-24">
            {movie.poster_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={movie.poster_url} 
                alt={movie.title}
                className="rounded-2xl shadow-2xl aspect-[2/3] object-cover w-full border border-white/10"
              />
            ) : (
              <div className="rounded-2xl shadow-2xl aspect-[2/3] w-full bg-gradient-to-br from-surface-elevated to-surface-base border border-white/10 flex items-center justify-center">
                <Film className="w-16 h-16 text-content-muted" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-content-primary mb-3">Synopsis</h2>
            <p className="text-content-secondary leading-relaxed text-lg">
              {movie.description || "No synopsis available for this title."}
            </p>
          </section>

          {movie.chapters && movie.chapters.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-content-primary mb-4 flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-brand-400" />
                Chapters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movie.chapters.map((chapter, i) => (
                  <div key={i} className="glass p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-sm font-medium text-content-primary truncate mr-2">{chapter.title}</span>
                    <span className="text-xs text-content-muted whitespace-nowrap tabular-nums">
                      {formatDuration(chapter.time)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Info Sidebar */}
        <div className="md:col-span-1">
          <section className="glass p-6 rounded-2xl sticky top-24">
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

      {/* Mobile Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 glass border-t border-white/10 flex gap-3 z-50">
        <button 
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="btn-primary flex-1 h-12 px-2 shadow-lg group text-sm"
        >
          {isCreatingRoom ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Users className="w-4 h-4 mr-1.5" />
          )}
          Host Party
        </button>
        <button 
          onClick={() => router.push(`/watch/${movie.id}`)}
          className="btn-secondary flex-1 h-12 px-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 text-sm"
        >
          <Play className="w-4 h-4 mr-1.5" />
          Solo Watch
        </button>
      </div>
    </div>
  );
}
