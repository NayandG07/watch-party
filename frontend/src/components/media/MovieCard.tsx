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
    <article className="group relative bg-white rounded-2xl border border-surface-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col h-full focus-within:ring-2 focus-within:ring-brand-500">
      {/* Poster image container */}
      <div className="relative aspect-[2/3] bg-slate-100 overflow-hidden shrink-0">
        {movie.poster_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 text-slate-400">
            <Film className="w-12 h-12 mb-2 stroke-[1.5]" aria-hidden="true" />
            <span className="text-xs font-semibold text-center text-slate-500 truncate max-w-full">
              {movie.title}
            </span>
          </div>
        )}

        {/* Gradient overlays for high contrast overlay icons */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Metadata Chips on Top */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
          {movie.resolution ? (
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
              {movie.resolution}
            </span>
          ) : (
            <span />
          )}

          {movie.year && (
            <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              {movie.year}
            </span>
          )}
        </div>

        {/* Direct Action Overlay on Hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <Link
            href={`/movie/${movie.id}`}
            className="btn-primary w-full h-11 text-xs font-bold shadow-lg gap-2"
            aria-label={`Watch ${movie.title}`}
          >
            <Play className="w-4 h-4 fill-white" />
            Start Watching
          </Link>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3 className="text-sm font-bold text-content-primary line-clamp-1 group-hover:text-brand-600 transition-colors">
            <Link href={`/movie/${movie.id}`} className="focus:outline-none">
              {movie.title}
            </Link>
          </h3>

          {/* Subtitles & Audio metadata chips if present */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-content-secondary">
            {movie.duration_seconds > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                <Clock className="w-3 h-3 text-slate-500" />
                {formatDuration(movie.duration_seconds)}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
