"use client";

import Link from "next/link";
import { Play, Sparkles, Tv2, Clock } from "lucide-react";
import type { Movie } from "@/types";

interface HeroSpotlightProps {
  movie?: Movie | null;
  onHostParty?: (movieId: string) => void;
}

export default function HeroSpotlight({ movie }: HeroSpotlightProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "2h 15m";
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${m}m`;
    }
    return `${minutes}m`;
  };

  const title = movie?.title || "Interstellar Experience";
  const duration = formatDuration(movie?.duration_seconds);
  const resolution = movie?.resolution || "4K ULTRA HD";
  const backdrop = movie?.backdrop_url || movie?.poster_url;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-10 group bg-surface-base">
      {/* Background artwork & ambient spotlight */}
      <div className="absolute inset-0 z-0">
        {backdrop ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={backdrop}
            alt={title}
            className="w-full h-full object-cover object-center opacity-45 scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-950/80 via-surface-base to-brand-900/60" />
        )}
        {/* Gradients to blend smoothly into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-default via-surface-default/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-default via-surface-default/80 to-transparent" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Foreground Hero Content */}
      <div className="relative z-10 p-6 sm:p-8 md:p-12 max-w-2xl flex flex-col justify-end min-h-[340px] md:min-h-[400px]">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="badge-brand font-bold text-[11px] uppercase tracking-wider px-2.5 py-0.5">
            <Sparkles className="w-3 h-3 mr-1" /> Featured Spotlight
          </span>
          <span className="bg-white/10 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 uppercase">
            {resolution}
          </span>
          <span className="text-content-secondary text-xs flex items-center gap-1 font-medium ml-1">
            <Clock className="w-3 h-3" /> {duration}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-content-primary tracking-tight leading-tight mb-3 text-balance">
          {title}
        </h1>

        {/* Subtitle / Synopsis */}
        <p className="text-sm sm:text-base text-content-secondary line-clamp-2 mb-6 leading-relaxed">
          {movie?.description ||
            "Stream together with trusted friends in synchronized 4K playback, frame-accurate real-time controls, and live interactive reactions."}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {movie ? (
            <Link
              href={`/movie/${movie.id}`}
              className="btn-primary text-sm px-6 py-3 shadow-lg flex items-center gap-2 font-bold"
            >
              <Tv2 className="w-4 h-4" />
              Host Watch Party
            </Link>
          ) : (
            <Link
              href="/rooms"
              className="btn-primary text-sm px-6 py-3 shadow-lg flex items-center gap-2 font-bold"
            >
              <Tv2 className="w-4 h-4" />
              Start Watch Party
            </Link>
          )}

          {movie && (
            <Link
              href={`/movie/${movie.id}`}
              className="btn-secondary text-sm px-5 py-3 flex items-center gap-2 font-semibold"
            >
              <Play className="w-4 h-4 fill-current" />
              Solo Watch
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
