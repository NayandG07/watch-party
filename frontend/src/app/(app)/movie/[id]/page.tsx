"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play, Users, Clock, Calendar, Tv, Film, ListVideo, Sparkles, ShieldCheck } from "lucide-react";
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
        setError("Failed to load title details");
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
        name: `${movie.title} Watch Party`,
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
      <div className="flex flex-col justify-center items-center h-[65vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-content-secondary">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <Film className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-content-primary mb-2">{error || "Movie not found"}</h2>
        <p className="text-sm text-content-secondary mb-6">The requested title may have been moved or removed from your library.</p>
        <button onClick={() => router.push("/library")} className="btn-secondary">
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Hero Backdrop Banner */}
      <div className="relative w-full aspect-[21/9] max-h-[500px] min-h-[340px] bg-slate-900 rounded-3xl overflow-hidden shadow-card border border-slate-200/80">
        {movie.backdrop_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={movie.backdrop_url} 
            alt={movie.title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-brand opacity-40" />
        )}
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
        
        {/* Back navigation */}
        <button 
          onClick={() => router.push("/library")}
          className="absolute top-6 left-6 z-10 w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-900 transition-colors border border-white/10 focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Back to Library"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Content overlaid on backdrop */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/30 mb-3 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cinematic Title</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3 drop-shadow-md">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-slate-200 mb-6">
              {movie.year && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md">
                  <Calendar className="w-4 h-4 text-brand-300" />
                  <span>{movie.year}</span>
                </div>
              )}
              {movie.duration_seconds > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md">
                  <Clock className="w-4 h-4 text-brand-300" />
                  <span>{formatDuration(movie.duration_seconds)}</span>
                </div>
              )}
              {movie.resolution && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md uppercase tracking-wide text-xs font-bold text-amber-300">
                  <Tv className="w-4 h-4" />
                  <span>{movie.resolution}</span>
                </div>
              )}
            </div>
            
            <div className="hidden md:flex flex-wrap gap-4">
              <button 
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                className="btn-primary h-12 px-8 shadow-brand text-sm font-bold min-h-[44px]"
              >
                {isCreatingRoom ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Users className="w-5 h-5 mr-2" />
                )}
                Host Watch Party
              </button>
              
              <button 
                onClick={() => router.push(`/watch/${movie.id}`)}
                className="btn-secondary h-12 px-8 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border-white/20 text-sm font-bold min-h-[44px]"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Solo Watch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
        
        {/* Poster Column */}
        <div className="hidden md:block col-span-1">
          <div className="sticky top-24">
            {movie.poster_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={movie.poster_url} 
                alt={movie.title}
                className="rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 aspect-[2/3] object-cover w-full border border-slate-200/80"
              />
            ) : (
              <div className="rounded-2xl shadow-card aspect-[2/3] w-full bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                <Film className="w-12 h-12 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-500">{movie.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-8">
          <section className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-content-primary mb-3">Synopsis</h2>
            <p className="text-content-secondary leading-relaxed text-sm sm:text-base">
              {movie.description || "No synopsis available for this title. Host a room to watch together in synchronized real-time playback."}
            </p>
          </section>

          {movie.chapters && movie.chapters.length > 0 && (
            <section className="card p-6 sm:p-8">
              <h2 className="text-lg font-bold text-content-primary mb-4 flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-brand-600" />
                <span>Chapters</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movie.chapters.map((chapter, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between hover:border-brand-300 transition-colors">
                    <span className="text-xs font-bold text-content-primary truncate mr-2">{chapter.title}</span>
                    <span className="text-xs font-semibold text-content-muted tabular-nums bg-white px-2 py-0.5 rounded border border-slate-200">
                      {formatDuration(chapter.time)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Sidebar Metadata */}
        <div className="md:col-span-1">
          <section className="card p-6 sticky top-24 space-y-4">
            <h3 className="text-xs font-bold text-content-muted uppercase tracking-wider border-b border-slate-100 pb-3">
              Media Information
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-content-secondary font-medium">Status</span>
                <span className="badge badge-success font-bold">
                  {movie.is_processed ? "Ready to Stream" : "Processing"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-content-secondary font-medium">Storage Host</span>
                <span className="font-semibold text-content-primary flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Encrypted Storage
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Sticky CTA Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 flex gap-3 z-50 shadow-card">
        <button 
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="btn-primary flex-1 h-12 text-sm font-bold min-h-[44px]"
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
          className="btn-secondary flex-1 h-12 text-sm font-bold min-h-[44px]"
        >
          <Play className="w-4 h-4 mr-1.5 fill-current" />
          Solo Watch
        </button>
      </div>
    </div>
  );
}
