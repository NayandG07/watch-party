"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "@/components/media/MovieCard";
import type { Movie } from "@/types";

interface HorizontalMovieLaneProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  extraHeader?: React.ReactNode;
}

export default function HorizontalMovieLane({
  title,
  subtitle,
  movies,
  extraHeader,
}: HorizontalMovieLaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (movies.length === 0) return null;

  return (
    <section className="mb-10 animate-fade-in group/lane">
      {/* Lane Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title">{title}</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-content-muted">
              {movies.length}
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-content-secondary mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {extraHeader}
          {/* Scroll buttons (hidden if few items on desktop, visible on hover) */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-xl bg-surface-elevated hover:bg-surface-overlay border border-surface-border flex items-center justify-center text-content-secondary hover:text-content-primary transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-xl bg-surface-elevated hover:bg-surface-overlay border border-surface-border flex items-center justify-center text-content-secondary hover:text-content-primary transition-all active:scale-95 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth snap-x snap-mandatory"
      >
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            className="w-[160px] sm:w-[190px] md:w-[210px] shrink-0 snap-start"
          >
            <MovieCard movie={movie} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
}
