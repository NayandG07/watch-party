"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Tv2, Users, Play, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { formatDuration, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface Room {
  id: string;
  name: string;
  state: "waiting" | "playing" | "paused" | "ended";
  position_seconds: number;
  created_at: string;
  movie?: {
    title: string;
    duration_seconds: number;
    backdrop_url?: string;
  } | null;
  creator: {
    id: string;
    username: string;
  };
}

export default function RoomsPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  function handleDeleteRoomClick(e: React.MouseEvent, roomId: string) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(roomId);
  }

  async function actuallyDeleteRoom(roomId: string) {
    setDeletingId(roomId);
    setConfirmDeleteId(null);
    try {
      await api.delete(`/api/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err) {
      console.error("Failed to delete room:", err);
      // Removed alert as per instructions, or we could set error state. We'll leave it out or use console.error
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in space-y-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Your Watch Rooms</h1>
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
        <div className="glass p-8 text-center text-red-500">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div className="glass min-h-[50vh] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-500 blur-3xl -ml-[150px]"></div>
            <div className="absolute w-[250px] h-[250px] rounded-full bg-purple-500 blur-3xl -mt-[100px]"></div>
            <div className="absolute w-[200px] h-[200px] rounded-full bg-blue-500 blur-3xl ml-[100px]"></div>
          </div>
          
          <Tv2 className="w-16 h-16 mb-6 text-brand-500/50 z-10" />
          <h3 className="text-xl font-medium text-content-primary mb-3 z-10">No Rooms Yet</h3>
          <p className="text-sm text-content-secondary max-w-sm mx-auto mb-8 z-10">
            Start by browsing the library and clicking &apos;Host Party&apos; on any movie.
          </p>
          <Link href="/library" className="btn-primary inline-flex z-10">
            Browse Library
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const canDelete = currentUser && (room.creator.id === currentUser.id || currentUser.role === "super_admin" || room.creator.username === currentUser.username);
            
            const isPlaying = room.state === "playing";
            const isPaused = room.state === "paused";
            const isWaiting = room.state === "waiting";
            const isEnded = room.state === "ended";

            return (
              <Link
                key={room.id}
                href={`/room/${room.id}`}
                className="group block"
              >
                <div className={cn(
                  "glass overflow-hidden h-full flex flex-col hover:border-brand-500/30 transition-all duration-300 relative",
                  isPlaying && "shadow-[0_20px_60px_rgba(34,197,94,0.15)]"
                )}>
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] bg-surface-elevated overflow-hidden">
                    {room.movie?.backdrop_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={room.movie.backdrop_url}
                        alt={room.movie.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-brand opacity-30 flex items-center justify-center">
                        <Tv2 className="w-10 h-10 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Status badge & Delete button */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      {canDelete && (
                        <button
                          onClick={(e) => handleDeleteRoomClick(e, room.id)}
                          disabled={deletingId === room.id}
                          className="w-7 h-7 rounded-lg bg-black/60 hover:bg-red-600 text-white/70 hover:text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete room"
                        >
                          {deletingId === room.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border",
                        isPlaying && "bg-green-500/10 text-green-400 border-green-500/20",
                        isPaused && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        isWaiting && "bg-gray-500/10 text-gray-400 border-gray-500/20",
                        isEnded && "bg-surface-elevated/80 text-content-muted border-white/5"
                      )}>
                        {!isEnded && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isPlaying && "bg-green-400 animate-pulse",
                            isPaused && "bg-amber-400",
                            isWaiting && "bg-gray-400"
                          )} />
                        )}
                        {isPlaying ? "Live" : isPaused ? "Paused" : isWaiting ? "Waiting" : "Ended"}
                      </div>
                    </div>

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                      <div className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 ml-1" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    {room.movie && room.movie.duration_seconds > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20">
                        <div
                          className="h-full bg-brand-500 relative"
                          style={{ width: `${Math.min(100, Math.max(0, (room.position_seconds / room.movie.duration_seconds) * 100))}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-400 shadow-glow pointer-events-none"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      {room.movie?.backdrop_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={room.movie.backdrop_url} 
                          alt="Poster" 
                          className="w-12 h-16 rounded-lg object-cover shrink-0 bg-surface-elevated"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-content-primary truncate mb-1">
                          {room.name}
                        </h3>
                        <p className="text-sm text-content-secondary truncate">
                          {room.movie ? room.movie.title : "Waiting for movie..."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between text-xs text-content-muted pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Host: {room.creator.username}
                      </div>
                      <div className="tabular-nums">
                        {room.movie ? `${formatDuration(room.position_seconds)} / ${formatDuration(room.movie.duration_seconds)}` : "0:00 / 0:00"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass p-6 rounded-2xl max-w-sm w-full text-center animate-scale-in modal-panel relative">
            <h3 className="text-lg font-bold text-content-primary">Delete this room?</h3>
            <p className="text-sm text-content-secondary mt-2 mb-6">Everyone will be disconnected.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(null); }} 
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); actuallyDeleteRoom(confirmDeleteId); }} 
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
