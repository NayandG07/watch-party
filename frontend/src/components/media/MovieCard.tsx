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
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          
          {/* Quick Stats (visible on hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              {movie.year && <span>{movie.year}</span>}
              {movie.year && movie.resolution && <span className="w-1 h-1 rounded-full bg-white/50" />}
              {movie.resolution && (
                <span className="border border-white/30 px-1 rounded text-[10px] uppercase">{movie.resolution}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-content-primary truncate group-hover:text-brand-300 transition-colors">
            {movie.title}
          </h3>
          <p className="text-xs text-content-secondary mt-1">
            {Math.floor(movie.duration_seconds / 60)} min
          </p>
        </div>
      </article>
    </Link>
  );
}
