"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Users, MessageSquare, Share2, Loader2, Lock, Unlock,
  PlayCircle, Film, Link2, X
} from "lucide-react";

// Inline YouTube icon since this lucide version doesn't include it
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
import api from "@/lib/api";
import VideoPlayer from "@/components/player/VideoPlayer";
import YouTubePlayer from "@/components/player/YouTubePlayer";
import { useAuthStore } from "@/stores/authStore";
import { ChatMessageData } from "@/hooks/useSyncedPlayer";

interface MovieOption {
  id: string;
  title: string;
}

interface RoomData {
  id: string;
  slug: string;
  name: string;
  state: string;
  position_seconds: number;
  speed: number;
  is_locked: boolean;
  creator: { id: string; username: string };
  movie: { id: string; title: string; duration_seconds: number; poster_url: string | null; backdrop_url?: string | null } | null;
  external_url: string | null;
  created_at: string;
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(1);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [isSettingMedia, setIsSettingMedia] = useState(false);

  const playerRef = useRef<{
    sendChatMessage: (c: string, t?: "text" | "emoji_reaction" | "timestamp_share", r?: number) => void;
    seek: (time: number) => void;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    async function loadRoom() {
      try {
        const inviteToken = searchParams.get("invite");
        if (inviteToken) {
          try {
            await api.post(`/api/rooms/${id}/join`, { invite_token: inviteToken });
            router.replace(`/room/${id}`);
          } catch (joinErr) {
            console.error("Failed to join with invite:", joinErr);
          }
        }

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
  }, [id, searchParams, router]);

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

  const handleOpenMediaPicker = async () => {
    setShowMediaPicker(true);
    if (movies.length === 0) {
      try {
        const { data } = await api.get<MovieOption[]>("/api/movies");
        setMovies(Array.isArray(data) ? data : []);
      } catch {
        setMovies([]);
      }
    }
  };

  const handleSetMovie = async (movieId: string) => {
    setIsSettingMedia(true);
    try {
      const { data } = await api.patch<RoomData>(`/api/rooms/${id}/set-media`, {
        movie_id: movieId,
        external_url: null,
      });
      setRoom(data);
      setShowMediaPicker(false);
    } catch { /* noop */ }
    finally { setIsSettingMedia(false); }
  };

  const handleSetYouTube = async () => {
    if (!youtubeInput.trim()) return;
    setIsSettingMedia(true);
    try {
      const { data } = await api.patch<RoomData>(`/api/rooms/${id}/set-media`, {
        movie_id: null,
        external_url: youtubeInput.trim(),
      });
      setRoom(data);
      setShowMediaPicker(false);
      setYoutubeInput("");
    } catch { /* noop */ }
    finally { setIsSettingMedia(false); }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  const hasMedia = !!(room.movie || room.external_url);

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
            {isHost && (
              <button
                onClick={handleOpenMediaPicker}
                className="btn-secondary h-8 px-3 text-xs bg-black/40 border-white/10 hover:bg-black/60 text-white"
              >
                <Film className="w-3.5 h-3.5 mr-1.5" />
                {hasMedia ? "Change Media" : "Select Media"}
              </button>
            )}
            <button className="btn-secondary h-8 px-3 text-xs bg-black/40 border-white/10 hover:bg-black/60 text-white">
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Invite
            </button>
          </div>
        </header>

        {/* Video area */}
        <div className="flex-1 flex items-center justify-center">
          {!hasMedia ? (
            /* Empty room — waiting for host to select media */
            <div className="text-center text-content-secondary">
              <div className="w-24 h-24 rounded-3xl bg-surface-raised flex items-center justify-center mx-auto mb-6 border border-surface-elevated">
                <Film className="w-12 h-12 text-brand-500/50" />
              </div>
              <h2 className="text-2xl font-bold text-content-primary mb-2">No media selected</h2>
              <p className="text-sm mb-8 max-w-xs mx-auto">
                {isHost
                  ? "Pick something to watch from your library or paste a YouTube link."
                  : "Waiting for the host to select media…"}
              </p>
              {isHost && (
                <button onClick={handleOpenMediaPicker} className="btn-primary">
                  <Film className="w-4 h-4 mr-2" />
                  Select Media
                </button>
              )}
            </div>
          ) : room.external_url ? (
            <YouTubePlayer
              url={room.external_url}
              roomId={room.id}
              wsToken={wsToken ?? undefined}
              isHost={isHost}
              onChatMessage={(msg) => setMessages((prev) => [...prev, msg])}
              onMemberUpdate={(count) => setMemberCount(count)}
              playerRef={playerRef}
            />
          ) : room.movie ? (
            <VideoPlayer
              movieId={room.movie.id}
              roomId={room.id}
              wsToken={wsToken ?? undefined}
              isHost={isHost}
              onChatMessage={(msg) => setMessages((prev) => [...prev, msg])}
              onMemberUpdate={(count) => setMemberCount(count)}
              playerRef={playerRef}
            />
          ) : null}
        </div>
      </div>

      {/* Chat Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-surface-raised bg-surface-base flex flex-col h-64 md:h-auto">
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-xs text-content-muted text-center py-8">No messages yet. Say hi!</p>
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
                  <p className="text-sm text-content-secondary break-words leading-relaxed">{msg.content}</p>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-content-primary">Select Media</h2>
              <button onClick={() => setShowMediaPicker(false)} className="text-content-muted hover:text-content-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* YouTube URL */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-content-secondary mb-2">
                <YoutubeIcon className="w-4 h-4 text-red-500" />
                YouTube / External URL
              </label>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                />
                <button
                  onClick={handleSetYouTube}
                  disabled={!youtubeInput.trim() || isSettingMedia}
                  className="btn-primary h-10 px-4 text-sm shrink-0"
                >
                  {isSettingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Library movies */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-content-secondary mb-2">
                <Film className="w-4 h-4 text-brand-400" />
                From Library
              </label>
              {movies.length === 0 ? (
                <p className="text-xs text-content-muted py-4 text-center">No movies in library yet.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {movies.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSetMovie(m.id)}
                      disabled={isSettingMedia}
                      className="w-full text-left px-4 py-3 rounded-xl bg-surface-raised hover:bg-surface-elevated transition-colors text-sm text-content-primary"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
