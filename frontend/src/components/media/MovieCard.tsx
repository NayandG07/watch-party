"use client";

import Link from "next/link";
import { Film, Play, Clock } from "lucide-react";
import type { Movie } from "@/types";

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${m}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Link href={`/movie/${movie.id}`} className="group relative flex flex-col gap-2 cursor-pointer focus:outline-none">
      {/* Poster frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-stone-200 dark:border-neutral-900 bg-stone-100 dark:bg-neutral-900 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-amber-500/60 dark:group-hover:border-amber-500/80 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]">
        {movie.poster_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <Film className="w-12 h-12 mb-2 stroke-[1.5] text-stone-400 dark:text-neutral-700" aria-hidden="true" />
            <span className="text-xs font-semibold text-center text-stone-500 dark:text-neutral-600 truncate max-w-full">
              {movie.title}
            </span>
          </div>
        )}

        {/* Resolution pill overlay */}
        {movie.resolution && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-zinc-300 uppercase tracking-wider z-10 shadow-sm pointer-events-none">
            {movie.resolution}
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center pl-1 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-6 h-6 text-[#050505] fill-[#050505]" />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex flex-col">
        <h3 className="font-display text-sm font-semibold text-stone-900 dark:text-zinc-100 line-clamp-1 group-hover:text-amber-500 transition-colors">
          {movie.title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-1">
          {movie.year && (
            <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-500">
              {movie.year}
            </span>
          )}
          {movie.year && movie.duration_seconds > 0 && (
            <span className="text-[10px] text-stone-400 dark:text-zinc-600">•</span>
          )}
          {movie.duration_seconds > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-500 dark:text-zinc-500">
              <Clock className="w-3 h-3" />
              {formatDuration(movie.duration_seconds)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
