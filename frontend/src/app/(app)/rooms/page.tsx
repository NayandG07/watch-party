"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Tv2, Users, Play, Plus, Trash2, Lock, Unlock, Copy, Check } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface Room {
  id: string;
  name: string;
  state: "waiting" | "playing" | "paused" | "ended";
  position_seconds: number;
  is_locked?: boolean;
  created_at: string;
  movie?: {
    id: string;
    title: string;
    duration_seconds: number;
    backdrop_url?: string;
    poster_url?: string;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyInvite = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleLock = async (e: React.MouseEvent, room: Room) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.patch<Room>(`/api/rooms/${room.id}`, { is_locked: !room.is_locked });
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, is_locked: data.is_locked } : r)));
    } catch (err) {
      console.error("Failed to toggle lock", err);
    }
  };

  async function actuallyDeleteRoom(roomId: string) {
    setDeletingId(roomId);
    setConfirmDeleteId(null);
    try {
      await api.delete(`/api/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err) {
      console.error("Failed to delete room:", err);
    } finally {
      setIsLoading(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-neutral-900">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Watch Parties & Rooms</h1>
          <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">Join active synchronized watch rooms or launch a new session.</p>
        </div>
        <button onClick={handleCreateRoom} disabled={isCreating} className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider active:scale-[0.98] h-11 px-5 rounded-xl flex items-center justify-center gap-2 transition-all">
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Create Watch Room</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm text-stone-500 dark:text-zinc-400 font-medium">Loading active rooms…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-2xl text-center text-sm font-semibold">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        /* Empty state */
        <div className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-xl my-12">
          <div className="w-20 h-20 rounded-full bg-stone-50 dark:bg-neutral-900 text-stone-400 dark:text-zinc-500 flex items-center justify-center mx-auto shadow-sm">
            <Tv2 className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white mb-2">No rooms yet — create your first watch party.</h2>
            <p className="text-sm text-stone-500 dark:text-zinc-400 leading-relaxed">
              Start a new room or pick a title from your library to invite friends.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={handleCreateRoom} disabled={isCreating} className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider active:scale-[0.98] h-11 px-6 rounded-xl transition-all">
              Create Watch Room
            </button>
            <Link href="/library" className="bg-white/10 hover:bg-white/20 text-stone-800 dark:text-white border border-stone-200 dark:border-white/10 backdrop-blur-sm h-11 px-6 rounded-xl flex items-center justify-center font-display font-bold text-xs uppercase tracking-wider transition-all">
              Browse Library
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isCreator = currentUser && (room.creator.id === currentUser.id || room.creator.username === currentUser.username);
            const canDelete = isCreator || currentUser?.role === "super_admin";
            
            const isPlaying = room.state === "playing";
            const isPaused = room.state === "paused";
            const isWaiting = room.state === "waiting";
            const isEnded = room.state === "ended";

            return (
              <div
                key={room.id}
                className="bg-white dark:bg-neutral-950/40 border border-stone-200 dark:border-neutral-900 rounded-2xl overflow-hidden shadow-xl transition-all hover:-translate-y-1.5 group flex flex-col justify-between"
              >
                {/* Room Thumbnail Banner */}
                <div className="relative aspect-[16/9] bg-neutral-900 overflow-hidden">
                  {room.movie?.backdrop_url || room.movie?.poster_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={room.movie.backdrop_url || room.movie.poster_url || ""}
                      alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center">
                      <Tv2 className="w-12 h-12 text-neutral-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-[#050505]/20 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border",
                      isPlaying && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      (isPaused || isWaiting) && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      isEnded && "bg-neutral-800/80 text-zinc-400 border-neutral-700"
                    )}>
                      {isPlaying ? "Live" : isPaused ? "Paused" : isWaiting ? "Waiting" : "Ended"}
                    </span>
                  </div>

                  {/* Member Count Chip */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950/75 backdrop-blur-md text-zinc-200 text-xs font-bold border border-white/10">
                    <Users className="w-3.5 h-3.5" />
                    <span>1 Member</span>
                  </div>

                  {/* Play Action Centered */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href={`/room/${room.id}`}
                      className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                      aria-label={`Join room ${room.name}`}
                    >
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </Link>
                  </div>
                </div>

                {/* Info & Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900 dark:text-white truncate">{room.name}</h3>
                    <p className="text-xs font-mono text-stone-500 dark:text-zinc-500 truncate mt-0.5">
                      {room.movie ? room.movie.title : "No movie selected"}
                    </p>
                  </div>

                  {/* Quick Action Toolbar directly exposed on card */}
                  <div className="pt-4 border-t border-stone-100 dark:border-neutral-900 flex items-center justify-between gap-2">
                    <Link
                      href={`/room/${room.id}`}
                      className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-[11px] uppercase tracking-wider h-9 px-4 rounded-xl flex items-center justify-center flex-1 transition-all"
                    >
                      Join Room
                    </Link>

                    <button
                      onClick={(e) => handleCopyInvite(e, room.id)}
                      className="h-9 px-3 rounded-xl flex items-center justify-center text-[11px] font-bold uppercase tracking-wider gap-1 text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white transition-colors border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-900"
                      title="Copy Invite Link"
                    >
                      {copiedId === room.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === room.id ? "Copied" : "Invite"}</span>
                    </button>

                    {isCreator && (
                      <button
                        onClick={(e) => handleToggleLock(e, room)}
                        className="h-9 w-9 p-0 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                        title={room.is_locked ? "Unlock Room" : "Lock Room"}
                      >
                        {room.is_locked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(room.id); }}
                        disabled={deletingId === room.id}
                        className="h-9 w-9 p-0 rounded-xl flex items-center justify-center text-stone-400 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-500 transition-colors"
                        title="Delete Room"
                      >
                        {deletingId === room.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-[#050505]/80 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white dark:bg-neutral-950 border border-stone-200 dark:border-neutral-900 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl modal-panel relative">
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">Delete this watch party?</h3>
            <p className="text-sm text-stone-500 dark:text-zinc-400 mt-2 mb-6">All active participants will be disconnected immediately.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                className="bg-stone-100 dark:bg-neutral-900 hover:bg-stone-200 dark:hover:bg-neutral-800 text-stone-700 dark:text-zinc-300 font-display font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl flex-1 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => actuallyDeleteRoom(confirmDeleteId)} 
                className="text-rose-500 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 font-display font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl flex-1 transition-all"
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
