"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import VideoPlayer from "@/components/player/VideoPlayer";
import api from "@/lib/api";
import type { Movie } from "@/types";

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovie() {
      try {
        const { data } = await api.get<Movie>(`/api/movies/${id}`);
        setMovie(data);
      } catch {
        setError("Room not found or you don't have permission.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      fetchMovie();
    }
  }, [id]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
          <p className="text-content-muted">Loading player...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !movie) {
    return (
      <ProtectedRoute>
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center">
          <div className="text-center p-8 glass rounded-2xl max-w-md">
            <p className="text-danger mb-4 font-medium">{error || "Movie not found"}</p>
            <button onClick={() => router.back()} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
        {/* Header Overlay */}
        <header className="absolute top-0 left-0 right-0 p-6 z-40 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white drop-shadow-md">{movie.title}</h1>
        </header>

        {/* Video Player */}
        <div className="flex-1 w-full h-full">
          <VideoPlayer movieId={movie.id} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
