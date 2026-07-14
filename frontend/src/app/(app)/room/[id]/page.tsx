"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, MessageSquare, Share2, Loader2, Lock, Unlock, PlayCircle } from "lucide-react";
import api from "@/lib/api";
import VideoPlayer from "@/components/player/VideoPlayer";
import { useAuthStore } from "@/stores/authStore";
import { ChatMessageData } from "@/hooks/useSyncedPlayer";

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
  const [memberCount, setMemberCount] = useState(1);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [chatInput, setChatInput] = useState("");
  const playerRef = useRef<{ 
    sendChatMessage: (c: string, t?: "text" | "emoji_reaction" | "timestamp_share", r?: number) => void;
    seek: (time: number) => void;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    async function loadRoom() {
      try {
        const [roomRes, tokenRes, chatRes] = await Promise.all([
          api.get<RoomData>(`/api/rooms/${id}`),
          api.get<{ ws_token: string }>(`/api/rooms/${id}/ws-token`),
          api.get<ChatMessageData[]>(`/api/rooms/${id}/chat`),
        ]);
        setRoom(roomRes.data);
        setWsToken(tokenRes.data.ws_token);
        setMessages(chatRes.data);
      } catch {
        setError("Failed to load room. It may not exist or you don't have access.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRoom();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isHost = room ? room.creator.id === currentUser?.id : false;

  const handleToggleLock = async () => {
    if (!room || !isHost) return;
    try {
      const { data } = await api.patch<RoomData>(`/api/rooms/${id}`, { is_locked: !room.is_locked });
      setRoom(data);
    } catch (err) {
      console.error("Failed to toggle lock", err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !playerRef.current) return;
    playerRef.current.sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
                <p className="text-white/60 text-[11px] drop-shadow-md flex items-center gap-2">
                  <span>{isHost ? "You are the host" : `Hosted by ${room.creator.username}`}</span>
                  
                  {isHost ? (
                    <button 
                      onClick={handleToggleLock}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors ml-1"
                    >
                      {room.is_locked ? (
                        <><Lock className="w-2.5 h-2.5 text-warning" /> Locked</>
                      ) : (
                        <><Unlock className="w-2.5 h-2.5" /> Unlocked</>
                      )}
                    </button>
                  ) : (
                    room.is_locked && (
                      <span className="inline-flex items-center gap-1 text-warning/80 ml-1">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )
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
            onChatMessage={(msg) => setMessages((prev) => [...prev, msg])}
            onMemberUpdate={(count) => setMemberCount(count)}
            playerRef={playerRef}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-xs text-content-muted text-center py-8">
              No messages yet. Say hi!
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="group">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className={`text-xs font-medium ${msg.user.id === currentUser?.id ? "text-brand-400" : "text-white"}`}>
                    {msg.user.username}
                  </span>
                  <span className="text-[10px] text-content-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                {msg.message_type === "timestamp_share" ? (
                  <button 
                    onClick={() => {
                      if (isHost && msg.timestamp_reference !== undefined) {
                        playerRef.current?.seek(msg.timestamp_reference);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-brand-500/20 text-brand-300 text-xs mt-0.5 transition-colors ${
                      isHost ? "hover:bg-brand-500/30 cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <PlayCircle className="w-3 h-3" />
                    <span>{msg.content}</span>
                  </button>
                ) : (
                  <p className="text-sm text-content-secondary break-words leading-relaxed">
                    {msg.content}
                  </p>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="p-3 border-t border-surface-raised shrink-0">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              placeholder="Type a message…"
              className="input w-full pr-10 text-sm h-9"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-brand-400 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </aside>
    </main>
  );
}
