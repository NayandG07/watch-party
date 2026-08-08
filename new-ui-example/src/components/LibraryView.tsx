import React, { useState, useMemo } from "react";
import { AppView, Movie } from "../types";
import { Search, Filter, LayoutGrid, List, Check, ArrowUpDown, Play, Eye, Trash, Plus } from "lucide-react";

interface LibraryViewProps {
  setView: (view: AppView) => void;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onDeleteMovie?: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  setView,
  movies,
  onSelectMovie,
  onDeleteMovie,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedResolution, setSelectedResolution] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"title" | "year">("title");
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Extract list of all unique genres
  const genres = useMemo(() => {
    const all = movies.flatMap((m) => m.genre);
    return ["All", ...Array.from(new Set(all))];
  }, [movies]);

  // Filter and sort computation
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    if (searchTerm.trim() !== "") {
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.director?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGenre !== "All") {
      result = result.filter((m) => m.genre.includes(selectedGenre));
    }

    if (selectedResolution !== "All") {
      result = result.filter((m) => m.resolution === selectedResolution);
    }

    result.sort((a, b) => {
      if (sortOrder === "title") {
        return a.title.localeCompare(b.title);
      } else {
        return b.year - a.year; // newer first
      }
    });

    return result;
  }, [movies, searchTerm, selectedGenre, selectedResolution, sortOrder]);

  const toggleSelectMovie = (id: string) => {
    if (selectedMovieIds.includes(id)) {
      setSelectedMovieIds(selectedMovieIds.filter((mid) => mid !== id));
    } else {
      setSelectedMovieIds([...selectedMovieIds, id]);
    }
  };

  const handleCreateCollection = () => {
    if (selectedMovieIds.length === 0) return;
    alert(`Created shared collections containing ${selectedMovieIds.length} chosen movies!`);
    setSelectedMovieIds([]);
    setSelectionMode(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-neutral-900 pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Media Library</h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
            Browse and query synchronized video assets inside Backblaze B2
          </p>
        </div>

        {/* Global actions: Batch collection creation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelectedMovieIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
              selectionMode
                ? "bg-amber-500 border-amber-500 text-neutral-950 font-bold"
                : "border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-neutral-900"
            }`}
          >
            {selectionMode ? "Cancel Select" : "Selection Mode"}
          </button>
          
          <button
            onClick={() => setView("uploads")}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Toolbar controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 p-4 rounded-xl">
        {/* Left: Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search movie titles, directors..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-neutral-900/40 border border-stone-200 dark:border-neutral-800 rounded-lg text-xs text-stone-900 dark:text-white outline-none focus:border-amber-500"
          />
        </div>

        {/* Right: Filters, Views and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Collapsible toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg border border-stone-200 dark:border-neutral-800 text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-neutral-900"
            title="Toggle Filter Sidebar"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Sorting */}
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "title" | "year")}
              className="bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg text-[11px] font-semibold text-stone-600 dark:text-zinc-300 p-1.5 outline-none focus:border-amber-500"
            >
              <option value="title">Sort by Title</option>
              <option value="year">Sort by Year (Newest)</option>
            </select>
          </div>

          <div className="h-4 w-[1px] bg-stone-200 dark:bg-neutral-800 hidden sm:block" />

          {/* Grid / List switcher */}
          <div className="flex items-center rounded-lg border border-stone-200 dark:border-neutral-800 p-1 bg-stone-50 dark:bg-neutral-900">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-white dark:bg-neutral-850 text-amber-500 shadow-sm" : "text-stone-400"}`}
              title="Grid Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-white dark:bg-neutral-850 text-amber-500 shadow-sm" : "text-stone-400"}`}
              title="Compact List Layout"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Collapsible Sidebar Filter Column */}
        {showFilters && (
          <aside className="w-full lg:w-56 shrink-0 space-y-6 bg-white dark:bg-neutral-950/20 border border-stone-200 dark:border-neutral-900/60 p-5 rounded-2xl text-left h-fit animate-in slide-in-from-left-4 duration-300">
            
            {/* Genre list filters */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 block mb-3">
                Filter by Genre
              </span>
              <div className="space-y-1">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      selectedGenre === g
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-500 font-bold"
                        : "text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-neutral-900/40 hover:text-stone-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>{g}</span>
                    {selectedGenre === g && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution filter */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 block mb-3">
                Resolution Capacity
              </span>
              <div className="space-y-1">
                {["All", "4K UHD", "1080p"].map((res) => (
                  <button
                    key={res}
                    onClick={() => setSelectedResolution(res)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      selectedResolution === res
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-500 font-bold"
                        : "text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-neutral-900/40 hover:text-stone-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>{res}</span>
                    {selectedResolution === res && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

          </aside>
        )}

        {/* Dynamic Media List/Grid Column */}
        <div className="flex-1">
          {filteredAndSortedMovies.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border-2 border-dashed border-stone-200 dark:border-neutral-900 p-8">
              <p className="text-sm text-stone-500 dark:text-zinc-400">
                No videos match your active parameters or query.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGenre("All");
                  setSelectedResolution("All");
                }}
                className="mt-4 px-4 py-2 bg-stone-100 dark:bg-neutral-900 rounded-lg text-xs font-semibold text-amber-500 hover:bg-stone-200"
              >
                Clear all active filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            
            /* GRID VIEW: Gorgeous 2:3 posters with hover interactions */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredAndSortedMovies.map((movie) => {
                const isSelected = selectedMovieIds.includes(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelectMovie(movie.id);
                      } else {
                        onSelectMovie(movie);
                        setView("movie-details");
                      }
                    }}
                    className="group cursor-pointer flex flex-col space-y-2 relative"
                  >
                    {/* Interactive 2:3 card frame with premium outlines */}
                    <div
                      className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border bg-stone-100 dark:bg-neutral-900 transition-all duration-300 ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/40 scale-95"
                          : "border-stone-200 dark:border-neutral-900 group-hover:-translate-y-1.5 group-hover:border-amber-500/80 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      }`}
                    >
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />

                      {/* Display floating badges */}
                      <div className="absolute top-2 left-2 flex flex-col space-y-1">
                        <span className="px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-md border border-white/10 text-[9px] font-mono text-zinc-300">
                          {movie.resolution}
                        </span>
                        {movie.rating && (
                          <span className="px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-md border border-white/10 text-[9px] font-mono text-zinc-300 text-center">
                            {movie.rating}
                          </span>
                        )}
                      </div>

                      {/* Standard checkbox overlay when selection mode is active */}
                      {selectionMode && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            isSelected ? "bg-amber-500 border-amber-500 text-neutral-950" : "border-white bg-black/40 text-transparent"
                          }`}>
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        </div>
                      )}

                      {/* Immersive Quick actions on hover */}
                      {!selectionMode && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center space-y-2 p-3">
                          <button className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-600 hover:scale-105 active:scale-95 text-neutral-950 transition-all">
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded border border-white/10">
                            {movie.duration}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-left flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                          {movie.title}
                        </h4>
                        <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-500 block mt-0.5">
                          {movie.year} • {movie.genre[0]}
                        </span>
                      </div>
                      
                      {/* Delete option for owners */}
                      {onDeleteMovie && !selectionMode && movie.owner.includes("You") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove ${movie.title} from B2 storage?`)) {
                              onDeleteMovie(movie.id);
                            }
                          }}
                          className="p-1 text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Asset"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            
            /* COMPACT LIST VIEW */
            <div className="rounded-xl border border-stone-200 dark:border-neutral-900 overflow-hidden bg-white dark:bg-neutral-950/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 text-stone-400 uppercase font-mono tracking-widest text-[9px]">
                    {selectionMode && <th className="p-4 w-12">Select</th>}
                    <th className="p-4">Title</th>
                    <th className="p-4">Genre</th>
                    <th className="p-4">Year</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">File Size</th>
                    <th className="p-4">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-neutral-900">
                  {filteredAndSortedMovies.map((movie) => {
                    const isSelected = selectedMovieIds.includes(movie.id);
                    return (
                      <tr
                        key={movie.id}
                        onClick={() => {
                          if (selectionMode) {
                            toggleSelectMovie(movie.id);
                          } else {
                            onSelectMovie(movie);
                            setView("movie-details");
                          }
                        }}
                        className="hover:bg-stone-50 dark:hover:bg-neutral-900/40 cursor-pointer transition-colors"
                      >
                        {selectionMode && (
                          <td className="p-4">
                            <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center ${
                              isSelected ? "bg-amber-500 border-amber-500 text-neutral-950" : "border-stone-300"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </td>
                        )}
                        <td className="p-4 font-bold text-stone-900 dark:text-white flex items-center space-x-3">
                          <img
                            src={movie.poster}
                            className="w-8 h-10 object-cover rounded"
                            referrerPolicy="no-referrer"
                          />
                          <span className="truncate">{movie.title}</span>
                        </td>
                        <td className="p-4 text-stone-500 dark:text-zinc-400">
                          {movie.genre.join(", ")}
                        </td>
                        <td className="p-4 font-mono text-stone-500 dark:text-zinc-400">
                          {movie.year}
                        </td>
                        <td className="p-4">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                            {movie.resolution}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-stone-500 dark:text-zinc-400">
                          {movie.sizeGb} GB
                        </td>
                        <td className="p-4 text-stone-500 dark:text-zinc-400">
                          {movie.owner}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action footer for batch selections */}
      {selectionMode && selectedMovieIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-6 z-40 bg-neutral-950 text-white border border-neutral-800 py-3.5 px-6 rounded-2xl max-w-2xl mx-auto flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold bg-amber-500 text-neutral-950 h-6 w-6 rounded-full flex items-center justify-center">
              {selectedMovieIds.length}
            </span>
            <p className="text-xs text-zinc-300">Movies highlighted for action</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedMovieIds([])}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5"
            >
              Clear Selected
            </button>
            <button
              onClick={handleCreateCollection}
              className="px-4 py-2 bg-amber-500 text-neutral-950 font-display font-bold text-xs tracking-wide rounded-xl hover:bg-amber-600 transition-all"
            >
              Assemble into Collection
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
