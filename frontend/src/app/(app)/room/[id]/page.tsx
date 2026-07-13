"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, MessageSquare, Share2, Loader2, Lock } from "lucide-react";
import api from "@/lib/api";
import VideoPlayer from "@/components/player/VideoPlayer";
import { useAuthStore } from "@/stores/authStore";

interface RoomData {
  id: string;
  slug: string;
  name: string;
  state: string;
  position_seconds: number;
  speed: number;
  is_locked: boolean;
  creator: { id: string; username: string };
  movie: { id: string; title: string; duration_seconds: number; poster_url: string | null };
  created_at: string;
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(1); // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    if (!id) return;
    async function loadRoom() {
      try {
        const [roomRes, tokenRes] = await Promise.all([
          api.get<RoomData>(`/api/rooms/${id}`),
          api.get<{ ws_token: string }>(`/api/rooms/${id}/ws-token`),
        ]);
        setRoom(roomRes.data);
        setWsToken(tokenRes.data.ws_token);
      } catch {
        setError("Failed to load room. It may not exist or you don't have access.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRoom();
  }, [id]);

  const isHost = room ? room.creator.id === currentUser?.id : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="glass p-8 rounded-2xl text-center max-w-sm">
          <p className="text-danger mb-4">{error || "Room not found"}</p>
          <button onClick={() => router.push("/library")} className="btn-secondary">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface-base animate-fade-in flex flex-col md:flex-row">
      {/* Main Player Area */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-black">
        {/* Header Overlay */}
        <header className="absolute top-0 left-0 right-0 p-4 md:p-6 z-10 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse-glow" />
                {memberCount > 1 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-[9px] text-white flex items-center justify-center font-bold">
                    {memberCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm drop-shadow-md">{room.name}</h1>
                <p className="text-white/60 text-[11px] drop-shadow-md">
                  {isHost ? "You are the host" : `Hosted by ${room.creator.username}`}
                  {room.is_locked && (
                    <span className="ml-2 inline-flex items-center gap-1 text-warning/80">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button className="btn-secondary h-8 px-3 text-xs bg-black/40 border-white/10 hover:bg-black/60 text-white">
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Invite
            </button>
          </div>
        </header>

        {/* Video */}
        <div className="flex-1 flex items-center justify-center">
          <VideoPlayer
            movieId={room.movie.id}
            roomId={room.id}
            wsToken={wsToken ?? undefined}
            isHost={isHost}
          />
        </div>
      </div>

      {/* Sidebar Chat & Members */}
      <aside className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-surface-raised bg-surface-base flex flex-col h-64 md:h-auto">
        {/* Tabs */}
        <div className="flex border-b border-surface-raised shrink-0">
          <button className="flex-1 py-3 text-xs font-medium text-brand-400 border-b-2 border-brand-400 flex flex-col items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button className="flex-1 py-3 text-xs font-medium text-content-muted hover:text-content-secondary transition-colors flex flex-col items-center gap-1">
            <Users className="w-4 h-4" />
            Members
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs text-content-muted text-center py-8">
            Chat will be available in Phase 9
          </p>
        </div>

        {/* Chat input */}
        <div className="p-3 border-t border-surface-raised shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Type a message…"
              className="input w-full pr-10 text-sm h-9"
              disabled
            />
            <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-brand-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}
