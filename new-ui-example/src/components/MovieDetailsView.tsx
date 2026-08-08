import React, { useState } from "react";
import { AppView, Movie } from "../types";
import { Play, Tv, Share2, Clipboard, ArrowLeft, Check, Compass, Users } from "lucide-react";

interface MovieDetailsViewProps {
  movie: Movie;
  setView: (view: AppView) => void;
}

export const MovieDetailsView: React.FC<MovieDetailsViewProps> = ({ movie, setView }) => {
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInvite = () => {
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-left relative">
      
      {/* Return Navigation */}
      <button
        onClick={() => setView("library")}
        className="inline-flex items-center space-x-2 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Library</span>
      </button>

      {/* Hero Visual Card: Split layout with backdrop overlay */}
      <div className="relative rounded-3xl border border-stone-200 dark:border-neutral-900 overflow-hidden bg-neutral-950 p-6 sm:p-10 min-h-[460px] flex flex-col lg:flex-row gap-8 items-center justify-end">
        {/* Absolute Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdrop}
            alt={movie.title}
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient vignette to pop content text */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent lg:bg-gradient-to-r lg:from-neutral-950 lg:via-neutral-950/80 lg:to-transparent" />
        </div>

        {/* 2:3 Poster Graphic (Left side) */}
        <div className="relative z-10 w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-2xl">
          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>

        {/* Info panel description layout (Right side) */}
        <div className="relative z-10 flex-1 space-y-6 text-zinc-100">
          <div>
            {/* Header resolution caps */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-500/20">
                {movie.resolution}
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-semibold">
                {movie.rating || "PG-13"}
              </span>
              <span className="text-zinc-500 text-xs font-mono">•</span>
              <span className="text-zinc-300 text-xs font-semibold">{movie.year}</span>
              <span className="text-zinc-500 text-xs font-mono">•</span>
              <span className="text-zinc-300 text-xs font-semibold">{movie.duration}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {movie.title}
            </h1>
            {movie.director && (
              <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider mt-1.5">
                Directed by <span className="text-zinc-200 font-bold">{movie.director}</span>
              </p>
            )}
          </div>

          <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
            {movie.overview}
          </p>

          {/* Action triggers row */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setView("watch-room")}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-display font-bold text-xs tracking-wider uppercase transition-all flex items-center space-x-2 shadow-lg active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Host Watch Room</span>
            </button>

            <button
              onClick={() => setView("watch-room")}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-display font-semibold text-xs tracking-wider uppercase transition-all backdrop-blur-sm active:scale-95 flex items-center space-x-2"
            >
              <Tv className="w-4 h-4" />
              <span>Watch Alone</span>
            </button>

            <button
              onClick={handleCopyInvite}
              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95 flex items-center space-x-2"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Generate Lobby Invite</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed specs metadata: Audio and subtitles grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core parameters column */}
        <div className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>File Parameters</span>
          </h3>
          <div className="divide-y divide-stone-100 dark:divide-neutral-900 text-xs">
            <div className="py-2 flex justify-between">
              <span className="text-stone-500 dark:text-zinc-400">Owner:</span>
              <span className="font-semibold">{movie.owner}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-stone-500 dark:text-zinc-400">Visibility:</span>
              <span className="font-semibold">{movie.visibility}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-stone-500 dark:text-zinc-400">Backblaze File Size:</span>
              <span className="font-mono text-amber-600 dark:text-amber-500 font-bold">{movie.sizeGb} GB</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-stone-500 dark:text-zinc-400">Bitrate stream:</span>
              <span className="font-mono text-zinc-500">~ 42.5 Mbps</span>
            </div>
          </div>
        </div>

        {/* Audio channels column */}
        <div className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Audio Stream Layers</span>
          </h3>
          <div className="space-y-2">
            {movie.audioTracks.map((track) => (
              <div
                key={track}
                className="px-3 py-2 bg-stone-50 dark:bg-neutral-900 border border-stone-100 dark:border-neutral-800 rounded-xl text-xs font-medium text-stone-800 dark:text-zinc-300"
              >
                {track}
              </div>
            ))}
          </div>
        </div>

        {/* Subtitle files column */}
        <div className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center space-x-1.5">
            <Clipboard className="w-3.5 h-3.5" />
            <span>Associated Subtitles</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {movie.subtitleTracks.map((sub) => (
              <span
                key={sub}
                className="px-3 py-1.5 bg-stone-50 dark:bg-neutral-900 border border-stone-100 dark:border-neutral-800 rounded-lg text-xs font-mono font-semibold"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
