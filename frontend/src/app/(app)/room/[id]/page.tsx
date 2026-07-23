"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Users, MessageSquare, Share2, Loader2, Lock, Unlock,
  PlayCircle, Film, Link2, X, Check, Copy, Trash2,
  ChevronLeft, Send,
} from "lucide-react";

// Inline YouTube icon
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
      alert("Failed to generate invite link. Please try again.");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleDeleteRoom = async () => {
    if (!room || !isHost) return;
    if (!confirm("Are you sure you want to delete this room? Everyone will be disconnected.")) return;
    try {
      await api.delete(`/api/rooms/${id}`);
      router.push("/rooms");
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Failed to delete room.");
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !room) {
    return (
      <div className="h-full bg-surface-base flex items-center justify-center">
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

  // ── Sidebar Panel (shared between desktop and mobile drawer) ───────────────
  const SidebarPanel = () => (
    <div className="flex flex-col h-full">
      {/* Tab header */}
      <div className="flex border-b border-white/10 shrink-0">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "chat"
              ? "text-brand-400 border-b-2 border-brand-400"
              : "text-white/50 hover:text-white/70"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "members"
              ? "text-brand-400 border-b-2 border-brand-400"
              : "text-white/50 hover:text-white/70"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          {memberCount} Members
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-12">No messages yet. Say hi!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="group">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-xs font-semibold ${msg.user.id === currentUser?.id ? "text-brand-400" : "text-white/80"}`}>
                      {msg.user.username}
                    </span>
                    <span className="text-[10px] text-white/25 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 text-xs mt-0.5 transition-colors ${
                        isHost ? "hover:bg-brand-500/30 cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <PlayCircle className="w-3 h-3" />
                      <span>{msg.content}</span>
                    </button>
                  ) : (
                    <p className="text-sm text-white/70 break-words leading-relaxed">{msg.content}</p>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message…"
                className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-9 h-9 shrink-0 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </>
      ) : (
        /* Members tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {/* Host */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {room.creator.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{room.creator.username}</p>
              <p className="text-[11px] text-brand-400">Host</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>

          {connectedMembers.filter(mid => mid !== room.creator.id).length > 0 ? (
            connectedMembers
              .filter(mid => mid !== room.creator.id)
              .map((memberId, idx) => (
                <div key={memberId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-semibold text-sm shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">Viewer {idx + 1}</p>
                    <p className="text-[11px] text-white/40">Guest</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </div>
              ))
          ) : (
            <p className="text-xs text-white/30 text-center py-12">
              {isHost ? "Share the invite link to add members" : "No other members yet"}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-[#0d0d0f] overflow-hidden">

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-3 md:px-5 h-12 shrink-0 bg-[#141417] border-b border-white/8 z-20">
        {/* Back */}
        <button
          onClick={() => router.push("/rooms")}
          className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0"
          title="Back to Rooms"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Room info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Connection dot */}
          <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isConnected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-red-500"}`} />
          <h1 className="text-sm font-semibold text-white truncate">{room.name}</h1>
          <span className="text-xs text-white/35 shrink-0 hidden sm:block">
            {isHost ? "You are the host" : `Hosted by ${room.creator.username}`}
          </span>
          {isHost && (
            <button
              onClick={handleToggleLock}
              title={room.is_locked ? "Room locked — click to unlock" : "Room unlocked — click to lock"}
              className="hidden sm:flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors shrink-0"
            >
              {room.is_locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
              <span className="hidden md:block">{room.is_locked ? "Locked" : "Unlocked"}</span>
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isHost && (
            <>
              <button
                onClick={handleOpenMediaPicker}
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 hover:text-white text-xs font-medium transition-all"
              >
                <Film className="w-3.5 h-3.5" />
                {hasMedia ? "Change Media" : "Select Media"}
              </button>
              <button
                onClick={handleDeleteRoom}
                title="Delete Room"
                className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:block">Delete</span>
              </button>
            </>
          )}
          <button
            onClick={handleGenerateInvite}
            disabled={isGeneratingInvite}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 hover:text-brand-200 text-xs font-medium transition-all disabled:opacity-50"
          >
            {isGeneratingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:block">Invite</span>
          </button>
          {/* Mobile: chat toggle */}
          <button
            onClick={() => setMobileChatOpen(true)}
            className="flex xl:hidden items-center gap-1 h-8 px-2.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 hover:text-white text-xs transition-all relative"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {memberCount > 1 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-[9px] text-white flex items-center justify-center font-bold">
                {memberCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Body: Player + Sidebar ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Player column */}
        <div className="flex-1 flex flex-col min-w-0 bg-black overflow-hidden">
          {/* Mobile: host controls row */}
          {isHost && (
            <div className="flex sm:hidden items-center gap-2 px-3 py-2 bg-[#141417] border-b border-white/8 shrink-0">
              <button
                onClick={handleOpenMediaPicker}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 hover:text-white text-xs font-medium transition-all"
              >
                <Film className="w-3.5 h-3.5" />
                {hasMedia ? "Change Media" : "Select Media"}
              </button>
              <button
                onClick={handleToggleLock}
                className="flex items-center gap-1 h-8 px-3 rounded-lg bg-white/8 hover:bg-white/12 text-white/50 hover:text-white text-xs transition-all"
              >
                {room.is_locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                {room.is_locked ? "Locked" : "Unlocked"}
              </button>
            </div>
          )}

          {/* Video area — fills remaining height */}
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
            {!hasMedia ? (
              <div className="text-center text-white/40 px-4">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5 border border-white/8">
                  <Film className="w-10 h-10 text-brand-500/40" />
                </div>
                <h2 className="text-xl font-bold text-white/60 mb-2">No media selected</h2>
                <p className="text-sm mb-6 max-w-xs mx-auto">
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
                onRoomDeleted={() => {
                  alert("This room has been deleted by the host.");
                  router.push("/rooms");
                }}
                playerRef={playerRef}
              />
            ) : null}
          </div>
        </div>

        {/* ── Desktop Sidebar ────────────────────────────────────────────────── */}
        <aside className="hidden xl:flex w-72 2xl:w-80 shrink-0 flex-col border-l border-white/8 bg-[#141417] overflow-hidden">
          <SidebarPanel />
        </aside>
      </div>

      {/* ── Mobile Chat Drawer ─────────────────────────────────────────────── */}
      {mobileChatOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 xl:hidden"
            onClick={() => setMobileChatOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-[min(340px,90vw)] bg-[#141417] border-l border-white/10 flex flex-col xl:hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <span className="text-sm font-semibold text-white">Room Chat</span>
              <button
                onClick={() => setMobileChatOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
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
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1f] border border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Share Invite Link</h2>
              <button
                onClick={() => { setShowInviteModal(false); setInviteCopied(false); }}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-4">Share this link to invite others to your watch party:</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 font-mono focus:outline-none focus:border-brand-500/50 transition-colors"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleCopyInvite}
                className={`h-10 px-4 rounded-xl text-sm font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                  inviteCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-brand-500 hover:bg-brand-600 text-white"
                }`}
              >
                {inviteCopied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
              </button>
            </div>
            <p className="text-xs text-white/30">Expires in 48 hours · Up to 10 uses</p>
          </div>
        </div>
      )}

      {/* ── Media Picker Modal ─────────────────────────────────────────────── */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#1a1a1f] border border-white/10 shadow-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-base font-bold text-white">Select Media</h2>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* YouTube URL */}
            <div className="mb-5 shrink-0">
              <label className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                <YoutubeIcon className="w-4 h-4 text-red-500" />
                YouTube / External URL
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50 transition-colors"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                />
                <button
                  onClick={handleSetYouTube}
                  disabled={!youtubeInput.trim() || isSettingMedia}
                  className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white flex items-center gap-1.5 text-sm shrink-0 transition-all"
                >
                  {isSettingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-white/25">OR</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Library movies */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <label className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 shrink-0">
                <Film className="w-3.5 h-3.5 text-brand-400" />
                From Library
              </label>
              {movies.length === 0 ? (
                <p className="text-xs text-white/30 py-6 text-center">No movies in library yet.</p>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {movies.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSetMovie(m.id)}
                      disabled={isSettingMedia}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/80 hover:text-white border border-transparent hover:border-white/10"
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
    </div>
  );
}
