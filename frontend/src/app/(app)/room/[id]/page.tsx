"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Users, MessageSquare, Share2, Loader2, Lock, Unlock,
  PlayCircle, Film, Link2, X, Check, Copy, Trash2,
  ChevronLeft, Send, Crown
} from "lucide-react";
import api from "@/lib/api";
import VideoPlayer from "@/components/player/VideoPlayer";
import YouTubePlayer from "@/components/player/YouTubePlayer";
import { useAuthStore } from "@/stores/authStore";
import { ChatMessageData } from "@/hooks/useSyncedPlayer";
import { cn } from "@/lib/utils";

// Inline YouTube icon
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function hashColor(str: string): string {
  const colors = [
    'bg-brand-600', 'bg-purple-600', 'bg-indigo-600',
    'bg-violet-600', 'bg-fuchsia-700', 'bg-pink-700',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

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

  // Sidebar / mobile chat toggle
  const [activeTab, setActiveTab] = useState<"chat" | "members">("chat");
  const [connectedMembers, setConnectedMembers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Delete room state
  const [roomDeleteError, setRoomDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomDeletedByHost, setRoomDeletedByHost] = useState(false);

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

  const handleGenerateInvite = async () => {
    if (!room) return;
    setIsGeneratingInvite(true);
    try {
      const { data } = await api.post<{ invite_url: string }>("/api/invites", {
        room_id: room.id,
        expires_in_hours: 48,
        max_uses: 10,
      });
      setInviteLink(data.invite_url);
      setShowInviteModal(true);
    } catch (err) {
      console.error("Failed to generate invite:", err);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleDeleteRoom = () => {
    if (!room || !isHost) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRoom = async () => {
    if (!room || !isHost) return;
    try {
      await api.delete(`/api/rooms/${id}`);
      router.push("/rooms");
    } catch (err) {
      console.error("Failed to delete room:", err);
      setRoomDeleteError("Failed to delete room. Please try again.");
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-full bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !room) {
    return (
      <div className="h-full bg-[#050505] flex items-center justify-center p-4 text-zinc-100 font-sans">
        <div className="bg-neutral-950/40 p-8 rounded-2xl text-center max-w-sm border border-neutral-900 shadow-xl space-y-4">
          <p className="text-rose-500 font-semibold text-sm">{error || "Room not found"}</p>
          <button onClick={() => router.push("/library")} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm w-full py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-colors">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const hasMedia = !!(room.movie || room.external_url);

  // ── Sidebar Panel (shared between desktop and mobile drawer) ───────────────
  const SidebarPanel = () => (
    <div className="flex flex-col h-full bg-[#080808]/95 backdrop-blur-md text-zinc-100 font-sans">
      {/* Tab header */}
      <div className="flex border-b border-white/5 shrink-0 p-1">
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all min-h-[40px]",
            activeTab === "chat"
              ? "bg-amber-500/10 text-amber-500"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all min-h-[40px]",
            activeTab === "members"
              ? "bg-amber-500/10 text-amber-500"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Members ({memberCount})</span>
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-12 font-sans">No messages yet. Say hi!</p>
            ) : (
              messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const isGrouped = prevMsg && prevMsg.user.id === msg.user.id;
                const isOwn = msg.user.id === currentUser?.id;

                return (
                  <div key={msg.id} className="group flex gap-2.5 items-start">
                    {/* Avatar */}
                    {isGrouped ? (
                      <div className="w-8 h-8 shrink-0" />
                    ) : (
                      <div
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xl ${hashColor(msg.user.username)}`}
                      >
                        {msg.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={cn("text-xs font-bold font-sans", isOwn ? "text-amber-500" : "text-zinc-100")}>
                            {msg.user.username}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-600">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {msg.message_type === "timestamp_share" ? (
                        <button
                          onClick={() => {
                            if (isHost && msg.timestamp_reference !== undefined) {
                              playerRef.current?.seek(msg.timestamp_reference);
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-semibold mt-0.5 border border-amber-500/20 w-fit transition-colors",
                            isHost ? "hover:bg-amber-500/20 cursor-pointer" : "cursor-default"
                          )}
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>{msg.content}</span>
                        </button>
                      ) : (
                        <p className="text-xs text-zinc-300 break-words leading-relaxed font-sans">{msg.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/5 shrink-0 bg-[#080808]/95">
            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
              <input
                type="text"
                placeholder="Type a message…"
                className="flex-1 bg-neutral-900 border-none rounded-full pl-4 pr-10 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-white/10 font-sans"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="absolute right-1 top-1 w-8 h-8 rounded-full disabled:opacity-30 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-[#050505] transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      ) : (
        /* Members tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {/* Host */}
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className={`w-8 h-8 rounded-full ${hashColor(room.creator.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {room.creator.id.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate flex items-center gap-1.5 font-sans">
                {room.creator.username}
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              </p>
              <p className="text-[11px] text-amber-500 font-medium">Host</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          </div>

          {connectedMembers.filter(mid => mid !== room.creator.id).length > 0 ? (
            connectedMembers
              .filter(mid => mid !== room.creator.id)
              .map((memberId) => (
                <div key={memberId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className={`w-8 h-8 rounded-full ${hashColor(memberId)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {memberId.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-300 truncate font-sans">Member</p>
                    <p className="text-[11px] text-zinc-500 font-medium">Guest</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
              ))
          ) : (
            <p className="text-xs text-zinc-600 text-center py-12 font-sans">
              {isHost ? "Share the invite link to add members" : "No other members yet"}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-[#050505] text-zinc-100 select-none font-sans overflow-hidden">

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-16 shrink-0 bg-gradient-to-b from-black/90 to-transparent text-zinc-100 z-20 absolute top-0 left-0 right-0 pointer-events-none">
        {/* Left: Back & Room info */}
        <div className="flex items-center gap-3 min-w-0 pointer-events-auto">
          <button
            onClick={() => router.push("/rooms")}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 backdrop-blur-sm border border-white/10"
            title="Back to Rooms"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-display font-bold text-white truncate max-w-[150px] sm:max-w-xs">{room.name}</h1>

            {/* Persistent Sync Indicator */}
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
              isConnected
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold uppercase"
            )}>
              <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
              <span>{isConnected ? "Synced" : "Catching up"}</span>
            </div>
          </div>
        </div>

        {/* Center: Movie title (desktop) */}
        <div className="hidden md:flex flex-1 items-center justify-center min-w-0 px-4 pointer-events-auto">
          {room.movie && (
            <span className="truncate max-w-sm text-zinc-400 text-xs font-medium bg-neutral-950/40 px-3.5 py-1.5 rounded-full border border-neutral-900 backdrop-blur-sm">
              Watching: <strong className="text-white font-semibold">{room.movie.title}</strong>
            </span>
          )}
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0 pointer-events-auto">
          {/* Prominent Invite Friends Button */}
          <button
            onClick={handleGenerateInvite}
            disabled={isGeneratingInvite}
            className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            {isGeneratingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            <span>Invite friends</span>
          </button>

          {isHost && (
            <>
              <button
                onClick={handleToggleLock}
                title={room.is_locked ? "Unlock Room" : "Lock Room"}
                className="hidden sm:flex w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0 backdrop-blur-sm border border-white/10"
              >
                {room.is_locked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleOpenMediaPicker}
                className="hidden sm:flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10 backdrop-blur-sm"
              >
                <Film className="w-4 h-4" />
                <span>{hasMedia ? "Change Media" : "Select Media"}</span>
              </button>

              <button
                onClick={handleDeleteRoom}
                title="Delete Room"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-rose-500 hover:text-rose-400 transition-all backdrop-blur-sm border border-white/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Mobile: chat bottom sheet toggle button */}
          <button
            onClick={() => setMobileChatOpen(true)}
            className="flex lg:hidden items-center gap-1.5 h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all relative border border-white/10 backdrop-blur-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Panel</span>
            {memberCount > 1 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-[10px] text-[#050505] flex items-center justify-center font-extrabold">
                {memberCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Body: Player + Sidebar ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* Player column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505] overflow-hidden pt-16">
          {/* Mobile: compact host controls row */}
          {isHost && (
            <div className="flex sm:hidden items-center justify-between gap-2 px-3 py-2 bg-neutral-950/40 border-b border-neutral-900 shrink-0">
              <button
                onClick={handleOpenMediaPicker}
                className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white text-xs font-medium transition-all"
              >
                <Film className="w-3.5 h-3.5" />
                {hasMedia ? "Change Media" : "Select Media"}
              </button>
              <button
                onClick={handleToggleLock}
                className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-500 hover:text-white text-xs transition-all shrink-0"
              >
                {room.is_locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                {room.is_locked ? "Locked" : "Unlocked"}
              </button>
            </div>
          )}

          {/* Video area — fills remaining height */}
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden relative">
            {!hasMedia ? (
              <div className="text-center text-zinc-500 px-4">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-neutral-950/40 border border-neutral-900 flex items-center justify-center">
                    <Film className="w-12 h-12 text-zinc-700 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-xl font-display font-bold text-white mb-2">No media selected</h2>
                <p className="text-sm mb-6 max-w-xs mx-auto">
                  {isHost
                    ? "Pick something to watch from your library or paste a YouTube link."
                    : "Waiting for the host to select media…"}
                </p>
                {isHost && (
                  <button onClick={handleOpenMediaPicker} className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider h-10 px-6 rounded-xl inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <Film className="w-4 h-4" />
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
                isLocked={room.is_locked}
                onChatMessage={(msg) => setMessages((prev) => [...prev, msg])}
                onMemberUpdate={(count, userIds) => {
                  setMemberCount(count);
                  setConnectedMembers(userIds);
                }}
                playerRef={playerRef}
              />
            ) : room.movie ? (
              <VideoPlayer
                movieId={room.movie.id}
                roomId={room.id}
                wsToken={wsToken ?? undefined}
                isHost={isHost}
                isLocked={room.is_locked}
                onChatMessage={(msg) => setMessages((prev) => [...prev, msg])}
                onMemberUpdate={(count, userIds) => {
                  setMemberCount(count);
                  setConnectedMembers(userIds);
                }}
                onConnectionChange={(connected) => setIsConnected(connected)}
                onRoomDeleted={() => setRoomDeletedByHost(true)}
                playerRef={playerRef}
              />
            ) : null}
          </div>
        </div>

        {/* ── Desktop Sidebar ────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-white/5 bg-[#080808]/95 backdrop-blur-md overflow-hidden pt-16">
          <SidebarPanel />
        </aside>
      </div>

      {/* ── Mobile Chat Drawer ─────────────────────────────────────────────── */}
      {mobileChatOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden modal-backdrop"
            onClick={() => setMobileChatOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-[min(340px,90vw)] bg-[#080808]/95 backdrop-blur-md border-l border-white/5 flex flex-col lg:hidden shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
              <span className="text-sm font-semibold text-white">Room Chat</span>
              <button
                onClick={() => setMobileChatOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarPanel />
            </div>
          </div>
        </>
      )}

      {/* ── Invite Modal ───────────────────────────────────────────────────── */}
      {showInviteModal && inviteLink && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-neutral-950 border border-neutral-900 shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500/80 via-yellow-400 to-emerald-500/80" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-display font-bold text-white">Share Invite Link</h2>
              </div>
              <button
                onClick={() => { setShowInviteModal(false); setInviteCopied(false); }}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-zinc-400 mb-4 font-sans">Share this link to invite others to your watch party:</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-sm text-zinc-300 font-mono focus:outline-none focus:border-amber-500 transition-colors"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleCopyInvite}
                className={`h-[46px] px-5 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all ${
                  inviteCopied
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500 hover:bg-amber-600 text-[#050505]"
                }`}
              >
                {inviteCopied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
              </button>
            </div>
            
            <div className="mt-4 flex items-center">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-full">48 hours · 10 uses</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Media Picker Modal ─────────────────────────────────────────────── */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-950 border border-neutral-900 shadow-2xl p-6 max-h-[80vh] flex flex-col relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500/80 via-yellow-400 to-emerald-500/80" />
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-base font-display font-bold text-white">Select Media</h2>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* YouTube URL */}
            <div className="mb-5 shrink-0">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                <YoutubeIcon className="w-4 h-4 text-amber-500" />
                YouTube / External URL
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                />
                <button
                  onClick={handleSetYouTube}
                  disabled={!youtubeInput.trim() || isSettingMedia}
                  className="bg-amber-500 hover:bg-amber-600 text-[#050505] disabled:opacity-40 h-10 px-4 rounded-xl flex items-center gap-1.5 text-sm shrink-0 transition-all active:scale-[0.98]"
                >
                  {isSettingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="flex-1 h-px bg-neutral-900" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">OR</span>
              <div className="flex-1 h-px bg-neutral-900" />
            </div>

            {/* Library movies */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 shrink-0">
                <Film className="w-3.5 h-3.5 text-amber-500" />
                From Library
              </label>
              {movies.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center font-sans">No movies in library yet.</p>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {movies.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSetMovie(m.id)}
                      disabled={isSettingMedia}
                      className="w-full flex gap-3 items-center text-left px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                    >
                      <div className="w-8 h-11 rounded-md bg-neutral-900 shrink-0 flex items-center justify-center">
                        <Film className="w-3 h-3 text-zinc-600" />
                      </div>
                      <span className="flex-1 text-sm text-zinc-300 font-sans">{m.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Room Delete Confirmation Modal ─────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-neutral-900 shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-500/80 via-red-400 to-rose-500/80" />
            <h2 className="text-lg font-display font-bold text-white mb-2">Delete Room?</h2>
            <p className="text-sm text-zinc-400 mb-6 font-sans">
              Are you sure you want to delete this room? Everyone will be disconnected immediately. This action cannot be undone.
            </p>
            {roomDeleteError && (
              <div className="text-rose-500 text-sm mb-4 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {roomDeleteError}
              </div>
            )}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRoomDeleteError(null);
                }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="bg-rose-500 hover:bg-rose-600 text-white font-display font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Room Deleted Overlay ───────────────────────────────────────────── */}
      {roomDeletedByHost && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex items-center justify-center">
          <div className="bg-neutral-950 border border-neutral-900 p-8 rounded-2xl text-center max-w-sm shadow-2xl animate-scale-in">
            <p className="text-lg font-display font-bold text-white mb-2">Room Closed</p>
            <p className="text-zinc-400 mb-6 text-sm font-sans">The host has ended the watch party.</p>
            <button onClick={() => router.push('/rooms')} className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all active:scale-[0.98]">
              Back to Rooms
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
