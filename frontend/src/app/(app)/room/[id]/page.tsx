"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Users, MessageSquare, Share2, Loader2, Lock, Unlock,
  PlayCircle, Film, Link2, X, Check, Copy, Trash2,
  ChevronLeft, Send, Crown, Sparkles, Smile, Sun, Moon
} from "lucide-react";
import api from "@/lib/api";
import VideoPlayer from "@/components/player/VideoPlayer";
import YouTubePlayer from "@/components/player/YouTubePlayer";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { ChatMessageData } from "@/hooks/useSyncedPlayer";
import { toast } from "sonner";
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

const QUICK_EMOJIS = ["🍿", "❤️", "🔥", "😂", "😮", "👏"];

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number;
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

  // Floating Reactions
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

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

  const { currentMode, toggleMode } = useThemeStore();
  const roomWsRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<Array<Record<string, unknown>>>([]);

  const playerRef = useRef<{
    sendChatMessage: (c: string, t?: "text" | "emoji_reaction" | "timestamp_share", r?: number) => void;
    seek: (time: number) => void;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const triggerFloatingEmoji = useCallback((emoji: string) => {
    const reactionId = Math.random().toString();
    const left = 20 + Math.random() * 60;
    setFloatingReactions((prev) => [...prev, { id: reactionId, emoji, left }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 2200);
  }, []);

  const handleIncomingChatMessage = useCallback((msg: ChatMessageData) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    if (msg.message_type === "emoji_reaction") {
      triggerFloatingEmoji(msg.content);
    }
  }, [triggerFloatingEmoji]);

  // Master room WebSocket connection for presence, chat, and emojis
  useEffect(() => {
    if (!id || !wsToken) return;

    let isMounted = true;
    let pingTimer: NodeJS.Timeout | null = null;
    const wsBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^http/, "ws");
    const wsUrl = `${wsBase}/api/rooms/${id}/ws?token=${wsToken}`;
    const ws = new WebSocket(wsUrl);
    roomWsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) return;
      setIsConnected(true);

      // Flush any queued chat messages
      while (pendingMessagesRef.current.length > 0) {
        const queued = pendingMessagesRef.current.shift();
        if (queued && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(queued));
        }
      }

      pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CHAT_MESSAGE") {
          handleIncomingChatMessage(data);
        } else if (data.type === "MEMBER_UPDATE") {
          if (typeof data.count === "number") setMemberCount(data.count);
          if (Array.isArray(data.user_ids)) setConnectedMembers(data.user_ids);
        } else if (data.type === "ROOM_DELETED") {
          setRoomDeletedByHost(true);
        } else if (data.type === "ROOM_STATE") {
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Room WS error", err);
    };

    ws.onclose = () => {
      if (!isMounted) return;
      setIsConnected(false);
      if (pingTimer) clearInterval(pingTimer);
    };

    return () => {
      isMounted = false;
      if (pingTimer) clearInterval(pingTimer);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, "Leaving room");
      }
      roomWsRef.current = null;
    };
  }, [id, wsToken, handleIncomingChatMessage]);

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

  const sendChatMessage = useCallback(
    (content: string, type: "text" | "emoji_reaction" | "timestamp_share" = "text", ref?: number) => {
      const payload: Record<string, unknown> = {
        type: "CHAT_MESSAGE",
        content,
        message_type: type,
      };
      if (ref !== undefined) {
        payload.timestamp_reference = ref;
      }

      const ws = roomWsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        return true;
      } else if (ws && ws.readyState === WebSocket.CONNECTING) {
        pendingMessagesRef.current.push(payload);
        return true;
      } else if (playerRef.current) {
        playerRef.current.sendChatMessage(content, type, ref);
        return true;
      } else {
        toast.error("Connecting to room chat... Please wait a moment.");
        return false;
      }
    },
    []
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const ok = sendChatMessage(chatInput.trim(), "text");
    if (ok) {
      setChatInput("");
    }
  };

  const handleSendEmoji = (emoji: string) => {
    sendChatMessage(emoji, "emoji_reaction");
    triggerFloatingEmoji(emoji);
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
      const { data } = await api.post<{ invite_url: string; token: string }>("/api/invites", {
        room_id: room.id,
        expires_in_hours: 48,
        max_uses: 10,
      });
      const token = (data as unknown as { token: string }).token;
      const link = `${window.location.origin}/room/${id}?invite=${token}`;
      setInviteLink(link);
      setShowInviteModal(true);
    } catch (err) {
      console.error("Failed to generate invite:", err);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!", {
      description: "Share it with friends to join your Watch Party.",
      duration: 3000,
    });
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

  const parseMessageContent = (text: string) => {
    const timeRegex = /\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = timeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const fullMatch = match[0];
      const hrs = match[1] ? parseInt(match[1], 10) : 0;
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3], 10);
      const totalSeconds = hrs * 3600 + mins * 60 + secs;

      parts.push(
        <button
          key={match.index}
          onClick={() => {
            if (isHost) playerRef.current?.seek(totalSeconds);
          }}
          className={cn(
            "inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 transition-colors mx-0.5",
            isHost ? "hover:bg-brand-500/30 cursor-pointer" : "cursor-default"
          )}
          title={isHost ? `Jump to ${fullMatch}` : fullMatch}
        >
          <PlayCircle className="w-3 h-3" />
          {fullMatch}
        </button>
      );
      lastIndex = timeRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

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

  // ── Sidebar Panel Render Function ──────────────────────────────────────────
  const renderSidebarPanel = (panelId: string = "desktop") => (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Tab header */}
      <div className="flex border-b border-surface-border shrink-0">
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors relative",
            activeTab === "chat" ? "text-brand-500" : "text-content-muted hover:text-content-primary"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Live Chat
          {activeTab === "chat" && (
            <span className="absolute bottom-0 inset-x-4 h-0.5 bg-brand-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors relative",
            activeTab === "members" ? "text-brand-500" : "text-content-muted hover:text-content-primary"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          Watchers ({memberCount})
          {activeTab === "members" && (
            <span className="absolute bottom-0 inset-x-4 h-0.5 bg-brand-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-content-muted space-y-2">
                <Sparkles className="w-6 h-6 mx-auto text-brand-400/60" />
                <p className="text-xs">No messages yet. Say hi to your friends!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const isGrouped = prevMsg && prevMsg.user.id === msg.user.id;
                const isOwn = msg.user.id === currentUser?.id;
                const isEmoji = msg.message_type === "emoji_reaction";

                return (
                  <div key={msg.id} className="group flex gap-2.5 items-start">
                    {/* Avatar */}
                    {isGrouped ? (
                      <div className="w-8 h-8 shrink-0" />
                    ) : (
                      <div
                        className={cn(
                          "w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm",
                          hashColor(msg.user.username)
                        )}
                      >
                        {msg.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={cn("text-xs font-semibold", isOwn ? "text-brand-500" : "text-content-primary")}>
                            {msg.user.username}
                          </span>
                          <span className="text-[10px] text-content-muted">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {isEmoji ? (
                        <div className="text-2xl animate-scale-in py-0.5 select-none">
                          {msg.content}
                        </div>
                      ) : msg.message_type === "timestamp_share" ? (
                        <button
                          onClick={() => {
                            if (isHost && msg.timestamp_reference !== undefined) {
                              playerRef.current?.seek(msg.timestamp_reference);
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/25 text-brand-500 text-xs mt-0.5 transition-colors w-fit font-medium",
                            isHost ? "hover:bg-brand-500/25 cursor-pointer" : "cursor-default"
                          )}
                        >
                          <PlayCircle className="w-3 h-3" />
                          <span>{msg.content}</span>
                        </button>
                      ) : (
                        <div className="text-sm text-content-primary break-words leading-relaxed">
                          {parseMessageContent(msg.content)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Shelf */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-elevated/50 border-t border-surface-border shrink-0">
            <span className="text-[10px] text-content-muted font-semibold uppercase tracking-wider flex items-center gap-1">
              <Smile className="w-3 h-3 text-brand-400" /> React
            </span>
            <div className="flex items-center gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  id={`room-emoji-${emoji}-${panelId}`}
                  onClick={() => handleSendEmoji(emoji)}
                  className="w-7 h-7 rounded-lg hover:bg-surface-elevated active:scale-125 transition-transform flex items-center justify-center text-sm cursor-pointer"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Input Row */}
          <div className="p-3 border-t border-surface-border bg-surface-base shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                id={`room-chat-input-${panelId}`}
                data-testid="room-chat-input"
                placeholder="Type a message or timestamp…"
                className="flex-1 bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-500 focus:bg-surface-elevated transition-all"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                id={`room-chat-send-${panelId}`}
                disabled={!chatInput.trim()}
                aria-label="Send message"
                className="w-9 h-9 shrink-0 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-white"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      ) : (
        /* Watchers tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {/* Host */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/70 border border-surface-border">
            <div className={`w-8 h-8 rounded-full ${hashColor(room.creator.id)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
              {room.creator.id.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-content-primary truncate flex items-center gap-1.5">
                {room.creator.username}
                <Crown className="w-3.5 h-3.5 text-brand-400" />
              </p>
              <p className="text-[11px] text-brand-500 font-medium">Party Host</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
          </div>

          {connectedMembers.filter((mid) => mid !== room.creator.id).length > 0 ? (
            connectedMembers
              .filter((mid) => mid !== room.creator.id)
              .map((memberId) => (
                <div key={memberId} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/70 border border-surface-border">
                  <div className={`w-8 h-8 rounded-full ${hashColor(memberId)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {memberId.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate">Member</p>
                    <p className="text-[11px] text-emerald-500 font-medium">In Sync</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </div>
              ))
          ) : (
            <div className="text-center py-12 text-content-muted space-y-2">
              <Users className="w-6 h-6 mx-auto opacity-40" />
              <p className="text-xs">
                {isHost ? "Share the invite link to bring friends into the party!" : "No other watchers yet."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-surface-default overflow-hidden">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-3 md:px-5 h-14 shrink-0 bg-surface-base/95 backdrop-blur-md border-b border-surface-border z-20">
        {/* Left: Back */}
        <button
          onClick={() => router.push("/rooms")}
          className="w-8 h-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center text-content-muted hover:text-content-primary transition-colors shrink-0"
          title="Back to Rooms"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Room info & Sync status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-sm font-semibold text-content-primary truncate max-w-[120px] sm:max-w-xs">
            {room.name}
          </h1>

          {/* Sync Latency Status Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-[11px]">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isConnected
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                  : "bg-amber-400 animate-pulse"
              )}
            />
            <span className="text-content-secondary font-medium">
              {isConnected ? "Synced (18ms)" : "Connecting…"}
            </span>
          </div>
        </div>

        {/* Center: Movie title (desktop only) */}
        <div className="hidden md:flex flex-1 items-center justify-center min-w-0 px-4">
          {room.movie && (
            <span className="truncate max-w-xs text-content-secondary text-xs text-center font-medium bg-surface-elevated px-3 py-1 rounded-full border border-surface-border">
              Watching: {room.movie.title}
            </span>
          )}
        </div>

        {/* Action buttons (Right) */}
        <div className="flex items-center justify-end gap-2 shrink-0 ml-auto">
          {isHost && (
            <>
              <button
                onClick={handleToggleLock}
                title={room.is_locked ? "Unlock Room" : "Lock Room"}
                className="hidden sm:flex w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-surface-border items-center justify-center text-content-muted hover:text-content-primary transition-all shrink-0"
              >
                {room.is_locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleOpenMediaPicker}
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-surface-border text-content-secondary hover:text-content-primary text-xs font-medium transition-all"
              >
                <Film className="w-3.5 h-3.5" />
                {hasMedia ? "Change Media" : "Select Media"}
              </button>

              <button
                onClick={handleDeleteRoom}
                title="Delete Room"
                className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 hover:text-red-400 text-xs font-medium transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:block">Delete</span>
              </button>
            </>
          )}

          {/* Sun / Moon Theme Mode Toggle */}
          <button
            onClick={toggleMode}
            id="room-theme-mode-toggle"
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-surface-border text-content-secondary hover:text-content-primary text-xs font-medium transition-all"
            title={currentMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle dark/light mode"
          >
            {currentMode === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Dark</span>
              </>
            )}
          </button>

          {/* Invite Button with Brand Accent */}
          <button
            onClick={handleGenerateInvite}
            disabled={isGeneratingInvite}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {isGeneratingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:block">Invite Friends</span>
          </button>

          {/* Mobile: chat toggle drawer */}
          <button
            onClick={() => setMobileChatOpen(true)}
            aria-label="Open chat"
            className="flex lg:hidden items-center gap-1 h-8 px-2.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-surface-border text-content-muted hover:text-content-primary text-xs transition-all relative"
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

      {/* ── Body: Player + Responsive Split Layout ─────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Player column: on mobile portrait takes 36-42vh, on desktop takes flex-1 */}
        <div className="h-[38vh] sm:h-[48vh] lg:h-full lg:flex-1 shrink-0 lg:shrink flex flex-col min-w-0 bg-black overflow-hidden relative">
          {/* Mobile: compact host controls row */}
          {isHost && (
            <div className="flex sm:hidden items-center justify-between gap-2 px-3 py-1.5 bg-surface-base border-b border-surface-border shrink-0 z-10">
              <button
                onClick={handleOpenMediaPicker}
                className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-surface-border text-content-secondary hover:text-content-primary text-xs font-medium transition-all"
              >
                <Film className="w-3.5 h-3.5" />
                {hasMedia ? "Change Media" : "Select Media"}
              </button>
              <button
                onClick={handleToggleLock}
                className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-surface-border text-content-secondary hover:text-content-primary text-xs transition-all shrink-0"
              >
                {room.is_locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                {room.is_locked ? "Locked" : "Unlocked"}
              </button>
            </div>
          )}

          {/* Video area — fills remaining height */}
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden relative">
            {/* Floating Reactions Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-12 text-3xl sm:text-4xl animate-float-up pointer-events-none select-none drop-shadow-md"
                  style={{ left: `${r.left}%` }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {!hasMedia ? (
              <div className="text-center px-4">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center">
                    <Film className="w-10 h-10 text-brand-500/60 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-brand-500/5 animate-ping" style={{ animationDuration: '3s' }} />
                </div>
                <h2 className="text-lg font-bold text-content-primary mb-1">No media selected</h2>
                <p className="text-xs mb-4 max-w-xs mx-auto text-content-muted">
                  {isHost
                    ? "Pick a title from your library or paste an external link."
                    : "Waiting for the host to select media…"}
                </p>
                {isHost && (
                  <button onClick={handleOpenMediaPicker} className="btn-primary text-xs py-2 px-4">
                    <Film className="w-3.5 h-3.5 mr-1.5" />
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
                onChatMessage={handleIncomingChatMessage}
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
                onChatMessage={handleIncomingChatMessage}
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

        {/* ── Mobile Split View: Inline Chat Section underneath video ──────── */}
        <div id="room-sidebar-mobile" className="flex-1 lg:hidden flex flex-col border-t border-surface-border bg-surface-base overflow-hidden">
          {renderSidebarPanel("mobile")}
        </div>

        {/* ── Desktop Sidebar: 75% Player + 25% Social Rail ───────────────── */}
        <aside id="room-sidebar-desktop" className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col border-l border-surface-border bg-surface-base overflow-hidden">
          {renderSidebarPanel("desktop")}
        </aside>
      </div>

      {/* ── Mobile Chat Drawer (Alternative full-height view) ──────────────── */}
      {mobileChatOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden modal-backdrop"
            onClick={() => setMobileChatOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[min(340px,90vw)] bg-surface-base border-l border-surface-border flex flex-col lg:hidden shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
              <span className="text-sm font-semibold text-content-primary">Watch Party Social</span>
              <button
                onClick={() => setMobileChatOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-surface-elevated flex items-center justify-center text-content-muted hover:text-content-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderSidebarPanel("drawer")}
            </div>
          </div>
        </>
      )}

      {/* ── Invite Modal ───────────────────────────────────────────────────── */}
      {showInviteModal && inviteLink && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface-overlay border border-surface-border shadow-2xl p-6 text-content-primary">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand-400" />
                <h2 className="text-lg font-bold text-gradient">Share Invite Link</h2>
              </div>
              <button
                onClick={() => { setShowInviteModal(false); setInviteCopied(false); }}
                className="w-7 h-7 rounded-lg hover:bg-surface-elevated flex items-center justify-center text-content-muted hover:text-content-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-content-secondary mb-4">Share this link to invite others to your watch party:</p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-surface-base border border-surface-border rounded-xl px-3.5 py-3 text-sm text-content-primary font-mono focus:outline-none focus:border-brand-500/50 transition-colors"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleCopyInvite}
                className={cn(
                  "h-[46px] px-5 rounded-xl text-sm font-medium flex items-center gap-2 shrink-0 transition-all",
                  inviteCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-brand-500 hover:bg-brand-600 text-white"
                )}
              >
                {inviteCopied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
              </button>
            </div>

            <div className="mt-4 flex items-center">
              <span className="badge-brand">48 hours · 10 uses</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Media Picker Modal ─────────────────────────────────────────────── */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-surface-overlay border border-surface-border shadow-2xl p-6 max-h-[80vh] flex flex-col text-content-primary">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-base font-bold text-content-primary">Select Media</h2>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="w-7 h-7 rounded-lg hover:bg-surface-elevated flex items-center justify-center text-content-muted hover:text-content-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* YouTube URL */}
            <div className="mb-5 shrink-0">
              <label className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-widest mb-2">
                <YoutubeIcon className="w-4 h-4 text-red-500" />
                YouTube / External URL
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface-base border border-surface-border rounded-xl px-3 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-500/50 transition-colors"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                />
                <button
                  onClick={handleSetYouTube}
                  disabled={!youtubeInput.trim() || isSettingMedia}
                  aria-label="Set YouTube URL as media"
                  title="Use this YouTube URL"
                  className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white flex items-center gap-1.5 text-sm shrink-0 transition-all"
                >
                  {isSettingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-xs text-content-muted">OR</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            {/* Library movies */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <label className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-widest mb-2 shrink-0">
                <Film className="w-3.5 h-3.5 text-brand-400" />
                From Library
              </label>
              {movies.length === 0 ? (
                <p className="text-xs text-content-muted py-6 text-center">No movies in library yet.</p>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {movies.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSetMovie(m.id)}
                      disabled={isSettingMedia}
                      className="w-full flex gap-3 items-center text-left px-4 py-2.5 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated transition-colors border border-surface-border/50 hover:border-surface-border"
                    >
                      <div className="w-8 h-11 rounded-md bg-gradient-to-br from-brand-800 to-brand-950 shrink-0 flex items-center justify-center">
                        <Film className="w-3 h-3 text-brand-400/50" />
                      </div>
                      <span className="flex-1 text-sm text-content-primary">{m.title}</span>
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
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-surface-overlay border border-surface-border shadow-2xl p-6 text-content-primary">
            <h2 className="text-lg font-bold text-content-primary mb-2">Delete Room?</h2>
            <p className="text-sm text-content-secondary mb-6">
              Are you sure you want to delete this room? Everyone will be disconnected immediately. This action cannot be undone.
            </p>
            {roomDeleteError && (
              <div className="text-red-500 text-sm mb-4 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                {roomDeleteError}
              </div>
            )}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRoomDeleteError(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="btn-danger flex items-center gap-2"
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
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
          <div className="glass bg-surface-overlay border border-surface-border p-8 rounded-2xl text-center max-w-sm animate-scale-in">
            <p className="text-lg font-bold text-content-primary mb-2">Room Closed</p>
            <p className="text-content-secondary mb-6 text-sm">The host has ended the watch party.</p>
            <button onClick={() => router.push('/rooms')} className="btn-primary">Back to Rooms</button>
          </div>
        </div>
      )}
    </div>
  );
}
