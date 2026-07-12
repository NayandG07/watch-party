import type { Metadata } from "next";
import { Film, Grid3X3, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Library",
};

// Placeholder skeleton card for loading state demo
function MovieCard({ index }: { index: number }) {
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
    <article className="card-hover group cursor-pointer overflow-hidden">
      {/* Poster */}
      <div className={`aspect-[2/3] bg-gradient-to-b ${color} relative flex items-end`}>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Film icon placeholder */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-0 transition-opacity">
          <Film className="w-12 h-12 text-white" />
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="h-4 w-3/4 skeleton rounded mb-1.5" />
        <div className="h-3 w-1/2 skeleton rounded" />
      </div>
    </article>
  );
}

function CollectionSection({ title, count }: { title: string; count: number }) {
  return (
    <section className="mb-10 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <button className="btn-ghost text-xs py-1.5 px-3">See all</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: count }, (_, i) => (
          <MovieCard key={i} index={i} />
        ))}
      </div>
    </section>
  );
}

export default function LibraryPage() {
  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">Library</h1>
          <p className="text-sm text-content-secondary mt-0.5">Browse your collections</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
            <input
              id="library-search"
              type="search"
              placeholder="Search…"
              className="input pl-9 w-48 focus:w-64 transition-all duration-300 h-9 text-sm"
            />
          </div>
          {/* View toggle */}
          <button className="btn-secondary h-9 px-3" aria-label="Grid view">
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Placeholder collections */}
      <CollectionSection title="Recently Added" count={6} />
      <CollectionSection title="Action & Adventure" count={5} />
      <CollectionSection title="Drama" count={4} />
    </div>
  );
}
