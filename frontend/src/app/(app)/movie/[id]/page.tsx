"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play, Users, Film, ListVideo, Sparkles, ShieldCheck } from "lucide-react";
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
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm font-medium text-stone-500 dark:text-zinc-400">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <Film className="w-8 h-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white mb-2">{error || "Movie not found"}</h2>
        <p className="text-sm text-stone-500 dark:text-zinc-400 mb-6">The requested title may have been moved or removed from your library.</p>
        <button onClick={() => router.push("/library")} className="bg-white/10 hover:bg-white/20 text-stone-800 dark:text-white border border-stone-300 dark:border-white/10 backdrop-blur-sm h-11 px-6 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-colors">
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Hero card */}
      <div className="relative rounded-3xl border border-stone-200 dark:border-neutral-900 overflow-hidden bg-stone-900 dark:bg-neutral-950 p-6 sm:p-10 min-h-[460px] flex flex-col lg:flex-row gap-8 items-center justify-end shadow-2xl">
        
        {/* Backdrop image */}
        {movie.backdrop_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={movie.backdrop_url} 
            alt={movie.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        ) : (
          <div className="absolute inset-0 bg-stone-900 dark:bg-neutral-950 opacity-40" />
        )}
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 dark:from-neutral-950 via-stone-900/70 dark:via-neutral-950/70 to-transparent" />
        <div className="absolute inset-0 lg:bg-gradient-to-r lg:from-stone-900 dark:lg:from-neutral-950 lg:via-stone-900/80 dark:lg:via-neutral-950/80 lg:to-transparent" />
        
        {/* Back navigation */}
        <button 
          onClick={() => router.push("/library")}
          className="absolute top-6 left-6 z-20 w-11 h-11 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-md text-zinc-400 hover:text-white transition-colors border border-white/10"
          title="Back to Library"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Poster */}
        <div className="z-10 w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-2xl mr-auto lg:mr-0 lg:order-last">
          {movie.poster_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={movie.poster_url} 
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-stone-800 dark:bg-neutral-900 flex flex-col items-center justify-center p-6 text-center">
              <Film className="w-12 h-12 text-stone-500 dark:text-neutral-700 mb-2" />
            </div>
          )}
        </div>

        {/* Content overlaid on backdrop */}
        <div className="z-10 w-full lg:flex-1">
          <div className="max-w-2xl lg:ml-auto lg:mr-10 lg:text-right">
            
            <div className="flex flex-wrap items-center gap-2 mb-4 lg:justify-end">
              {movie.year && (
                <span className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-zinc-300">
                  {movie.year}
                </span>
              )}
              {movie.duration_seconds > 0 && (
                <span className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-zinc-300">
                  {formatDuration(movie.duration_seconds)}
                </span>
              )}
              {movie.resolution && (
                <span className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-amber-400 uppercase font-bold tracking-wider">
                  {movie.resolution}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6 drop-shadow-lg">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <button 
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider h-12 px-8 rounded-xl flex items-center justify-center transition-transform active:scale-[0.98] shadow-lg"
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
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm h-12 px-8 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Watch Alone
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl shadow-xl">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Synopsis
            </h2>
            <p className="text-stone-800 dark:text-zinc-200 leading-relaxed text-sm sm:text-base">
              {movie.description || "No synopsis available for this title. Host a room to watch together in synchronized real-time playback."}
            </p>
          </section>

          {movie.chapters && movie.chapters.length > 0 && (
            <section className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl shadow-xl">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-amber-500" />
                Chapters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movie.chapters.map((chapter, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-stone-50 dark:bg-neutral-900/50 border border-stone-200 dark:border-neutral-800 flex items-center justify-between hover:border-amber-500/50 transition-colors">
                    <span className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate mr-2">{chapter.title}</span>
                    <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-zinc-400 tabular-nums bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-stone-200 dark:border-neutral-800">
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
          <section className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 border-b border-stone-200 dark:border-neutral-800 pb-3">
              Media Information
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-zinc-400 font-medium">Status</span>
                <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-mono font-semibold">
                  {movie.is_processed ? "Ready to Stream" : "Processing"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-zinc-400 font-medium">Storage Host</span>
                <span className="font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Encrypted
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Sticky CTA Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-stone-200 dark:border-neutral-800 flex gap-3 z-50">
        <button 
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider h-12 flex-1 rounded-xl flex items-center justify-center transition-transform active:scale-[0.98]"
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
          className="bg-white/10 hover:bg-white/20 text-stone-900 dark:text-white border border-stone-300 dark:border-white/10 backdrop-blur-sm h-12 flex-1 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center"
        >
          <Play className="w-4 h-4 mr-1.5 fill-current" />
          Solo Watch
        </button>
      </div>
    </div>
  );
}
