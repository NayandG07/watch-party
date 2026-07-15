"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Tv2, Users, Play, Plus } from "lucide-react";
import api from "@/lib/api";
import { formatDuration } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  state: "waiting" | "playing" | "paused" | "ended";
  position_seconds: number;
  created_at: string;
  movie: {
    title: string;
    duration_seconds: number;
    backdrop_url?: string;
  };
  creator: {
    username: string;
  };
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data } = await api.get<Room[]>("/api/rooms");
        setRooms(data);
      } catch {
        setError("Failed to load rooms");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRooms();
  }, []);

  async function handleCreateRoom() {
    setIsCreating(true);
    try {
      const { data } = await api.post("/api/rooms", { name: "Watch Party" });
      router.push(`/room/${data.id}`);
    } catch {
      setError("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content-primary">Your Watch Rooms</h1>
          <p className="text-content-secondary mt-1">Active watch parties and previous sessions.</p>
        </div>
        <button onClick={handleCreateRoom} disabled={isCreating} className="btn-primary h-10 px-4 text-sm">
          {isCreating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
          Create Room
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <div className="glass p-8 text-center text-danger">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div className="glass p-16 text-center text-content-secondary">
          <Tv2 className="w-16 h-16 mx-auto mb-4 text-brand-500/50" />
          <h3 className="text-xl font-medium text-content-primary mb-2">No Rooms Yet</h3>
          <p className="text-sm max-w-sm mx-auto mb-6">
            You haven&apos;t joined or created any watch parties yet. Browse the library and host a party to get started!
          </p>
          <Link href="/library" className="btn-primary inline-flex">
            Browse Library
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Link 
              key={room.id}
              href={`/room/${room.id}`}
              className="group block"
            >
              <div className="glass overflow-hidden h-full flex flex-col hover:border-brand-500/30 hover:shadow-glow transition-all duration-300">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-surface-raised overflow-hidden">
                  {room.movie.backdrop_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={room.movie.backdrop_url} 
                      alt={room.movie.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-brand opacity-30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase backdrop-blur-md ${
                      room.state === "playing" ? "bg-success/20 text-success border border-success/30" : 
                      room.state === "ended" ? "bg-surface-elevated/80 text-content-muted" :
                      "bg-warning/20 text-warning border border-warning/30"
                    }`}>
                      {room.state}
                    </span>
                  </div>
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 ml-1" />
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {room.movie.duration_seconds > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div 
                        className="h-full bg-brand-500" 
                        style={{ width: `${Math.min(100, Math.max(0, (room.position_seconds / room.movie.duration_seconds) * 100))}%` }} 
                      />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-content-primary line-clamp-1 mb-1">
                    {room.name}
                  </h3>
                  <p className="text-sm text-content-secondary line-clamp-1 mb-4">
                    Playing: {room.movie.title}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between text-xs text-content-muted">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Host: {room.creator.username}
                    </div>
                    <div>
                      {formatDuration(room.position_seconds)} / {formatDuration(room.movie.duration_seconds)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
