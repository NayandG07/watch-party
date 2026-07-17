"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import PlayerControls from "./PlayerControls";
import { ChatMessageData, useSyncedPlayer } from "@/hooks/useSyncedPlayer";

interface VideoPlayerProps {
  movieId: string;
  /** Sync mode: provide roomId + wsToken to enable synchronization */
  roomId?: string;
  wsToken?: string;
  isHost?: boolean;
  onChatMessage?: (msg: ChatMessageData) => void;
  onMemberUpdate?: (count: number, userIds: string[]) => void;
  playerRef?: React.MutableRefObject<{ 
    sendChatMessage: (c: string, t?: "text" | "emoji_reaction" | "timestamp_share", r?: number) => void;
    seek: (time: number) => void;
  } | null>;
}

export default function VideoPlayer({ 
  movieId, roomId, wsToken, isHost = false, onChatMessage, onMemberUpdate, playerRef 
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // UI state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync engine — only active when roomId + wsToken are provided
  const sync = useSyncedPlayer({
    roomId: roomId ?? "",
    wsToken: wsToken ?? null,
    videoRef,
    isHost,
    onChatMessage,
    onMemberUpdate,
  });
  const syncEnabled = !!roomId && !!wsToken;

  useEffect(() => {
    if (playerRef) {
      playerRef.current = { 
        sendChatMessage: sync.sendChatMessage,
        seek: sync.seek
      };
    }
  }, [playerRef, sync.sendChatMessage, sync.seek]);

  useEffect(() => {
    let mounted = true;
    
    async function initPlayer() {
      if (!videoRef.current) return;
      
      try {
        // 1. Fetch playback token
        const { data: tokenData } = await api.get(`/api/movies/${movieId}/hls-key-token`);
        
        if (!mounted) return;
        
        // 2. Initialize HLS
        if (Hls.isSupported()) {
          const hls = new Hls({
            xhrSetup: (xhr, url) => {
              // The backend rewrites the EXT-X-KEY URI to /api/movies/{id}/hls-key.
              // We append the JWT token as a query param so the backend can validate it.
              if (url.includes("/hls-key")) {
                const separator = url.includes("?") ? "&" : "?";
                xhr.open("GET", `${url}${separator}token=${tokenData.hls_key_token}`, true);
              }
            },
          });
          
          hlsRef.current = hls;
          hls.loadSource(tokenData.hls_url);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (mounted) setIsLoading(false);
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error("HLS Error:", data);
              if (mounted) setError("Failed to play video stream.");
            }
          });
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          // Fallback for Safari
          videoRef.current.src = tokenData.hls_url;
          videoRef.current.addEventListener("loadedmetadata", () => {
            if (mounted) setIsLoading(false);
          });
        }
      } catch (err) {
        console.error("Player initialization error:", err);
        if (mounted) setError("Failed to authenticate video stream.");
      }
    }
    
    initPlayer();
    
    return () => {
      mounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [movieId]);

  // Handle interaction & mouse move to show/hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", () => {
        if (isPlaying) setShowControls(false);
      });
    }
    
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    const pos = videoRef.current.currentTime;
    if (syncEnabled && isHost) {
      if (videoRef.current.paused) {
        sync.play(pos);
      } else {
        sync.pause(pos);
      }
    } else {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncEnabled, isHost, sync.play, sync.pause]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleDurationChange = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    if (syncEnabled && isHost) {
      sync.seek(time);
    } else {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, [containerRef]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
          }
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen]);

  if (error) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl">
        <div className="text-center text-danger glass p-6 rounded-xl border-danger/20">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video bg-black overflow-hidden shadow-2xl group select-none ${
        isFullscreen ? "" : "sm:rounded-3xl"
      } ${!showControls && isPlaying ? "cursor-none" : ""}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-base/80 z-20">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onVolumeChange={() => {
          if (videoRef.current) {
            setVolume(videoRef.current.volume);
            setIsMuted(videoRef.current.muted);
          }
        }}
        playsInline
      />

      <PlayerControls
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={(vol) => {
          if (videoRef.current) {
            videoRef.current.volume = vol;
            if (vol > 0) videoRef.current.muted = false;
          }
        }}
        onMuteToggle={() => {
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
          }
        }}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
        isVisible={showControls || !isPlaying}
        onShareTimestamp={() => {
          const timeStr = new Date(currentTime * 1000).toISOString().substr(11, 8).replace(/^00:/, '');
          sync.sendChatMessage(timeStr, "timestamp_share", currentTime);
        }}
      />
    </div>
  );
}
