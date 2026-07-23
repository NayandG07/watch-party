"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReactPlayerInstance = any;
// Cast to any to bypass react-player v3 type strictness
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Player = ReactPlayer as any;

import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { ChatMessageData } from "@/hooks/useSyncedPlayer";

interface YouTubePlayerProps {
  url: string;
  roomId?: string;
  wsToken?: string;
  isHost?: boolean;
  isLocked?: boolean;
  onChatMessage?: (msg: ChatMessageData) => void;
  onMemberUpdate?: (count: number, userIds: string[]) => void;
  onConnectionChange?: (connected: boolean) => void;
  playerRef?: React.MutableRefObject<{
    sendChatMessage: (c: string, t?: "text" | "emoji_reaction" | "timestamp_share", r?: number) => void;
    seek: (time: number) => void;
  } | null>;
}

// Minimal sync via WebSocket for YouTube rooms
function useYouTubeSync({
  roomId,
  wsToken,
  isHost,
  isLocked = false,
  onChatMessage,
  onMemberUpdate,
  onConnectionChange,
  playerRef: internalPlayerRef,
}: {
  roomId?: string;
  wsToken?: string;
  isHost: boolean;
  isLocked?: boolean;
  onChatMessage?: (msg: ChatMessageData) => void;
  onMemberUpdate?: (count: number, userIds: string[]) => void;
  onConnectionChange?: (connected: boolean) => void;
  playerRef: React.MutableRefObject<ReactPlayerInstance | null>;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Keep all mutable values in refs so the WS effect never re-runs due to them
  const isHostRef = useRef(isHost);
  const onChatMessageRef = useRef(onChatMessage);
  const onMemberUpdateRef = useRef(onMemberUpdate);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const internalPlayerRefRef = useRef(internalPlayerRef);

  isHostRef.current = isHost;
  onChatMessageRef.current = onChatMessage;
  onMemberUpdateRef.current = onMemberUpdate;
  onConnectionChangeRef.current = onConnectionChange;
  internalPlayerRefRef.current = internalPlayerRef;

  useEffect(() => {
    if (!roomId || !wsToken) return;

    const wsBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^http/, "ws");
    const wsUrl = `${wsBase}/api/rooms/${roomId}/ws?token=${wsToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      onConnectionChangeRef.current?.(true);
    };

    ws.onclose = () => {
      onConnectionChangeRef.current?.(false);
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "ROOM_STATE") {
        const adjustedPos = msg.position;
        setPosition(adjustedPos);
        setPlaying(msg.state === "playing");
        const player = internalPlayerRefRef.current.current;
        if (player) {
          const current = (player.getCurrentTime?.() ?? 0);
          if (Math.abs(current - adjustedPos) > 1.5) {
            player.seekTo(adjustedPos, "seconds");
          }
        }
      } else if (msg.type === "CHAT_MESSAGE") {
        onChatMessageRef.current?.(msg as ChatMessageData);
      } else if (msg.type === "MEMBER_UPDATE") {
        onMemberUpdateRef.current?.(msg.count, msg.user_ids ?? []);
      }
    };

    ws.onerror = () => ws.close();

    return () => {
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
      onConnectionChangeRef.current?.(false);
    };
  // Only reconnect when token or roomId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, wsToken]);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  const onPlay = useCallback(() => {
    if (!isLockedRef.current || isHostRef.current) {
      send({ type: "PLAY", position: internalPlayerRefRef.current.current?.getCurrentTime?.() ?? 0 });
    }
  }, [send]);

  const onPause = useCallback(() => {
    if (!isLockedRef.current || isHostRef.current) {
      send({ type: "PAUSE", position: internalPlayerRefRef.current.current?.getCurrentTime?.() ?? 0 });
    }
  }, [send]);

  const onProgress = useCallback(({ playedSeconds }: { playedSeconds: number }) => {
    setPosition(playedSeconds);
  }, []);

  const sendChatMessage = useCallback((content: string, type: "text" | "emoji_reaction" | "timestamp_share" = "text", ref?: number) => {
    send({ type: "CHAT_MESSAGE", content, message_type: type, timestamp_reference: ref });
  }, [send]);

  return { playing, position, onPlay, onPause, onProgress, sendChatMessage };
}

export default function YouTubePlayer({
  url, roomId, wsToken, isHost = false, isLocked = false, onChatMessage, onMemberUpdate, onConnectionChange, playerRef,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalPlayerRef = useRef<ReactPlayerInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const sync = useYouTubeSync({
    roomId,
    wsToken,
    isHost,
    isLocked,
    onChatMessage,
    onMemberUpdate,
    onConnectionChange,
    playerRef: internalPlayerRef,
  });

  // Expose controls to parent
  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        sendChatMessage: sync.sendChatMessage,
        seek: (time: number) => {
          if (isHost) {
            internalPlayerRef.current?.seekTo(time, "seconds");
          }
        },
      };
    }
  }, [playerRef, sync.sendChatMessage, isHost]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  if (!isYouTube && !url.startsWith("http")) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center text-danger rounded-2xl">
        <p>Cannot play this URL</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black group rounded-2xl overflow-hidden shadow-2xl">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      )}

      <Player
        ref={internalPlayerRef}
        url={url}
        width="100%"
        height="100%"
        playing={sync.playing}
        volume={volume}
        muted={isMuted}
        onReady={() => setIsReady(true)}
        onPlay={sync.onPlay}
        onPause={sync.onPause}
        onProgress={sync.onProgress}
        progressInterval={500}
        config={{ youtube: { playerVars: {
          disablekb: isHost ? 0 : 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
        } } }}
      />

      {/* Minimal controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isHost) {
                if (sync.playing) {
                  sync.onPause();
                } else {
                  sync.onPlay();
                }
              }
            }}
            className="text-white hover:text-brand-300 transition-colors disabled:opacity-40"
            disabled={!isHost}
          >
            {sync.playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsMuted((v) => !v)}
            className="text-white hover:text-brand-300 transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
            className="w-20 accent-brand-500"
          />
        </div>

        <button onClick={toggleFullscreen} className="text-white hover:text-brand-300 transition-colors">
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
