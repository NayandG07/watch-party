"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import type { Movie } from "@/types";

interface MovieCardProps {
  movie: Movie;
  index: number;
}

export default function MovieCard({ movie, index }: MovieCardProps) {
  // Use index to deterministically assign a fallback color
  const colors = [
    "from-brand-800 to-brand-950",
    "from-purple-900 to-indigo-950",
    "from-pink-900 to-brand-950",
    "from-indigo-800 to-purple-950",
    "from-violet-800 to-brand-950",
    "from-fuchsia-900 to-brand-950",
  ];
  const color = colors[index % colors.length];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${m}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Link href={`/movie/${movie.id}`} className="block">
      <article className="card-hover group cursor-pointer overflow-hidden">
        {/* Poster */}
        <div className={`aspect-[2/3] bg-gradient-to-b ${color} relative flex items-end overflow-hidden`}>
          {movie.poster_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={movie.poster_url} 
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-0 transition-opacity">
              <Film className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Permanent subtle bottom gradient for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Hover Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Resolution Badge */}
          {movie.resolution && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-black/50 backdrop-blur text-white/80 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                {movie.resolution}
              </span>
            </div>
          )}

          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg ring-0 group-hover:ring-2 group-hover:ring-white/20 transition-all">
              <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          
          {/* Quick Stats (visible on hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 translate-y-2 group-hover:translate-y-0 z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              {movie.year && <span>{movie.year}</span>}
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-content-primary truncate group-hover:text-brand-300 transition-colors flex items-center justify-between">
            <span className="truncate">{movie.title}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300 ml-2">
              →
            </span>
          </h3>
          <p className="text-xs text-content-secondary mt-1">
            {formatDuration(movie.duration_seconds)}
          </p>
        </div>
      </article>
    </Link>
  );
}
