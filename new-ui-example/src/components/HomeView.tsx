import React from "react";
import { AppView, Movie, Collection, Invitation } from "../types";
import { Play, Users, Clock, Flame, FolderHeart, Calendar, Compass, ArrowRight, Plus } from "lucide-react";

interface HomeViewProps {
  setView: (view: AppView) => void;
  movies: Movie[];
  collections: Collection[];
  invitations: Invitation[];
  onSelectMovie: (movie: Movie) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setView,
  movies,
  collections,
  invitations,
  onSelectMovie,
}) => {
  const dune = movies.find((m) => m.id === "dune-2") || movies[0];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. BENTO CONTAINER AREA */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bento Card 1: Quick Resume Masterpiece (Span 2) */}
        <div className="lg:col-span-2 relative h-[360px] rounded-2xl border border-stone-200 dark:border-neutral-900 overflow-hidden bg-neutral-900 group">
          {/* Backdrop Image */}
          <img
            src={dune.backdrop}
            alt={dune.title}
            className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
          {/* High Contrast Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-transparent" />

          {/* Top Info Banner */}
          <div className="absolute top-6 left-6 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
              Continue Watching
            </span>
          </div>

          {/* Core Content */}
          <div className="absolute bottom-6 inset-x-6 flex flex-col justify-end">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              {dune.title}
            </h2>
            <p className="font-body text-xs text-zinc-300 max-w-lg line-clamp-2 mb-4 opacity-90">
              {dune.overview}
            </p>

            {/* Playback Scrub tracker line */}
            <div className="space-y-2 mb-4 max-w-md">
              <div className="relative h-1 w-full bg-white/20 rounded-full">
                <div className="absolute h-full w-[62%] bg-amber-500 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>01:42:15 / 02:46:00 (62% watched)</span>
                <span>1h 4m remaining</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  onSelectMovie(dune);
                  setView("watch-room");
                }}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-neutral-950 text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Party</span>
              </button>
              <button
                onClick={() => {
                  onSelectMovie(dune);
                  setView("movie-details");
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition-all backdrop-blur-sm border border-white/10"
              >
                Inspect Details
              </button>
            </div>
          </div>
        </div>

        {/* Bento Card 2: Active Watch Lobby (Span 1) */}
        <div className="relative h-[360px] rounded-2xl border border-stone-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-6 flex flex-col justify-between overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent blur-xl pointer-events-none" />

          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Room Active
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">4 Watching</span>
            </div>

            <h3 className="font-display text-lg font-bold mt-4 leading-snug">
              Sarah's Cozy Screening
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Currently streaming: <span className="text-amber-600 dark:text-amber-400 font-semibold">{dune.title}</span>. 
              The room has master timeline sync on. Join now to jump right in with friends.
            </p>
          </div>

          {/* Members Avatars Stack */}
          <div className="my-4">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500 block mb-2">
              ACTIVE LISTENERS IN CIRCLE
            </span>
            <div className="flex items-center -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-950 bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-100">SJ</div>
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-950 bg-stone-700 flex items-center justify-center text-[10px] font-bold text-neutral-100">DM</div>
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-950 bg-stone-600 flex items-center justify-center text-[10px] font-bold text-neutral-100">ER</div>
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-950 bg-neutral-900 flex items-center justify-center text-[10px] font-bold text-neutral-100">MA</div>
              <div className="h-8 w-8 rounded-full bg-stone-100 dark:bg-neutral-900 border-2 border-white dark:border-neutral-950 flex items-center justify-center text-[9px] font-bold text-stone-400 dark:text-zinc-500">
                +0
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={() => {
              onSelectMovie(dune);
              setView("watch-room");
            }}
            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-stone-800 dark:hover:bg-zinc-200 active:scale-[0.98] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Join Synchronized Room</span>
          </button>
        </div>
      </section>


      {/* 2. LIBRARY PREVIEW ROWS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-900 pb-3">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-amber-500" />
            <h3 className="font-display text-lg font-bold">Recently Added Movies</h3>
          </div>
          <button
            onClick={() => setView("library")}
            className="text-xs font-semibold text-amber-600 dark:text-amber-500 hover:underline flex items-center space-x-1"
          >
            <span>View Full Library</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 2:3 Cinematic Ratio Posters Carousel list */}
        <div className="flex space-x-6 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
          {movies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => {
                onSelectMovie(movie);
                setView("movie-details");
              }}
              className="min-w-[150px] sm:min-w-[180px] w-[180px] group cursor-pointer snap-start flex flex-col space-y-2"
            >
              {/* Outer boundary card */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-stone-200 dark:border-neutral-900 bg-stone-100 dark:bg-neutral-900 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-amber-500/60 dark:group-hover:border-amber-500/80 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-zinc-300">
                  {movie.resolution}
                </div>
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  {movie.title}
                </h4>
                <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-500 mt-0.5">
                  {movie.year} • {movie.duration}
                </span>
              </div>
            </div>
          ))}

          {/* Quick Create Link box */}
          <div
            onClick={() => setView("uploads")}
            className="min-w-[150px] sm:min-w-[180px] w-[180px] aspect-[2/3] rounded-xl border-2 border-dashed border-stone-200 dark:border-neutral-900 bg-stone-50/50 dark:bg-neutral-950/20 hover:border-amber-500/50 hover:bg-amber-500/[0.01] transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center group"
          >
            <Plus className="w-6 h-6 text-stone-400 group-hover:text-amber-500 transition-colors mb-2" />
            <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400 group-hover:text-stone-900 dark:group-hover:text-zinc-200 transition-colors">
              Add Movie
            </span>
            <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 mt-1">
              Supports MKV, MP4
            </span>
          </div>
        </div>
      </section>

      {/* 3. SHARED COLLECTIONS ROWS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-900 pb-3">
          <div className="flex items-center space-x-2">
            <FolderHeart className="w-4 h-4 text-amber-500" />
            <h3 className="font-display text-lg font-bold">Recently Shared Collections</h3>
          </div>
        </div>

        {/* Collections Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => setView("collections")}
              className="relative h-[180px] rounded-xl overflow-hidden border border-stone-200 dark:border-neutral-900 bg-neutral-900 group cursor-pointer"
            >
              {/* Cover Art */}
              <img
                src={col.backdrop}
                alt={col.name}
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

              <div className="absolute bottom-5 inset-x-5 flex flex-col text-left">
                <span className="text-[9px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                  Curated by {col.owner}
                </span>
                <h4 className="font-display text-base sm:text-lg font-bold text-white mt-1">
                  {col.name}
                </h4>
                <p className="text-xs text-zinc-300 truncate mt-1 max-w-md">
                  {col.description}
                </p>
                <div className="mt-3 flex items-center space-x-4 text-[10px] font-mono text-zinc-400">
                  <span>{col.movieIds.length} Movies</span>
                  <span>•</span>
                  <span>{col.sharedFriends.length} Shared Friends</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ACTIVE WATCH INVITATIONS NOTIFICATIONS */}
      {invitations.length > 0 && (
        <section className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                You have active scheduled invitations!
              </h4>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Join {invitations[0].inviter} to watch {invitations[0].movieTitle} scheduled {invitations[0].scheduledTime}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setView("invitations")}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-600 font-display font-bold text-xs tracking-wide transition-all active:scale-[0.98]"
          >
            View Invitation Desk
          </button>
        </section>
      )}

    </div>
  );
};
