"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import PlayerControls, { QualityOption, SubtitleOption } from "./PlayerControls";
import { ChatMessageData, useSyncedPlayer } from "@/hooks/useSyncedPlayer";

interface VideoPlayerProps {
  movieId: string;
  /** Sync mode: provide roomId + wsToken to enable synchronization */
  roomId?: string;
  wsToken?: string;
  isHost?: boolean;
  isLocked?: boolean;
  onChatMessage?: (msg: ChatMessageData) => void;
  onMemberUpdate?: (count: number, userIds: string[]) => void;
  onConnectionChange?: (connected: boolean) => void;
  onRoomDeleted?: () => void;
  playerRef?: React.MutableRefObject<{
    sendChatMessage: (c: string, t?: "text" | "emoji_reaction" | "timestamp_share", r?: number) => void;
    seek: (time: number) => void;
  } | null>;
}

export default function VideoPlayer({
  movieId, roomId, wsToken, isHost = false, isLocked = false, onChatMessage, onMemberUpdate, onConnectionChange, onRoomDeleted, playerRef
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
  const [isSeeking, setIsSeeking] = useState(false);

  // Advanced Controls: HLS Subtitles, Quality, Speed
  const [qualities, setQualities] = useState<QualityOption[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [subtitles, setSubtitles] = useState<SubtitleOption[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const isHoveringControlsRef = useRef(false);

  // Sync engine — only active when roomId + wsToken are provided
  const sync = useSyncedPlayer({
    roomId: roomId ?? "",
    wsToken: wsToken ?? null,
    videoRef,
    isHost,
    onChatMessage,
    onMemberUpdate,
    onRoomDeleted,
  });
  const syncEnabled = !!roomId && !!wsToken;

  // Propagate connection state changes
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;
  useEffect(() => {
    onConnectionChangeRef.current?.(sync.isConnected);
  }, [sync.isConnected]);

  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        sendChatMessage: sync.sendChatMessage,
        seek: sync.seek
      };
    }
  }, [playerRef, sync.sendChatMessage, sync.seek]);

  const retryCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    retryCountRef.current = 0;

    async function initPlayer() {
      if (!videoRef.current) return;

      try {
        // 1. Fetch playback token (uses api.ts interceptor which auto-refreshes JWT on 401)
        const { data: tokenData } = await api.get(`/api/movies/${movieId}/hls-key-token`);

        if (!mounted) return;

        // Destroy any existing HLS instance before creating a new one
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        setError(null);
        setIsLoading(true);

        // 2. Initialize HLS
        if (Hls.isSupported()) {
          const hls = new Hls({
            startPosition: -1,       // Start from beginning
            maxBufferLength: 30,     // Buffer up to 30s ahead
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000, // 60MB max buffer
            autoStartLoad: true,
            xhrSetup: (xhr, url) => {
              if (url.includes("/hls-key")) {
                // Append the hls-key-token as a query param for the AES key request.
                // The browser won't forward Authorization headers on XHR requests
                // initiated by HLS.js for key files unless configured here.
                const separator = url.includes("?") ? "&" : "?";
                xhr.open("GET", `${url}${separator}token=${tokenData.hls_key_token}`, true);
              }
            },
          });

          hlsRef.current = hls;
          hls.loadSource(tokenData.hls_url);
          hls.attachMedia(videoRef.current);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!mounted) return;
            setIsLoading(false);
            retryCountRef.current = 0; // reset retries on successful load

            // Populate Quality Levels
            if (hls.levels && hls.levels.length > 0) {
              const parsedQualities: QualityOption[] = [
                { id: -1, name: "Auto" },
                ...hls.levels.map((lvl, i) => ({
                  id: i,
                  name: lvl.height ? `${lvl.height}p` : `Level ${i + 1}`
                }))
              ];
              setQualities(parsedQualities);
            }

            // Populate Subtitles
            if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
              const parsedSubs: SubtitleOption[] = [
                { id: -1, name: "Off" },
                ...hls.subtitleTracks.map((sub, i) => ({
                  id: i,
                  name: sub.name || sub.lang || `Track ${i + 1}`
                }))
              ];
              setSubtitles(parsedSubs);
            }
          });

          // LEVEL_LOADED gives us accurate per-level duration from the manifest
          hls.on(Hls.Events.LEVEL_LOADED, (_evt, data) => {
            if (!mounted) return;
            const levelDuration = data.details?.totalduration;
            if (levelDuration && levelDuration > 0 && isFinite(levelDuration)) {
              setDuration(levelDuration);
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!mounted) return;
            if (!data.fatal) return; // non-fatal errors are handled by HLS.js internally

            console.error("HLS Fatal Error:", data.type, data.details);

            // Key load errors mean the hls_key_token expired — re-fetch a fresh token
            // and reinitialize the player (up to 2 retries to avoid infinite loops).
            const isKeyError = data.details === "keyLoadError";
            const isNetworkError = data.type === "networkError";

            if ((isKeyError || isNetworkError) && retryCountRef.current < 2) {
              retryCountRef.current += 1;
              console.warn(`HLS ${data.details} — reinitializing player (attempt ${retryCountRef.current})`);
              hls.destroy();
              hlsRef.current = null;
              // Brief delay before retry to let any in-flight requests settle
              setTimeout(() => { if (mounted) initPlayer(); }, 1500);
            } else {
              setError("Failed to play video stream. Please refresh the page.");
            }
          });
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          // Native HLS (Safari / iOS)
          videoRef.current.src = tokenData.hls_url;
          videoRef.current.addEventListener("loadedmetadata", () => {
            if (mounted) setIsLoading(false);
          });
        }
      } catch (err) {
        console.error("Player initialization error:", err);
        if (mounted) setError("Failed to authenticate video stream. Please refresh the page.");
      }
    }

    initPlayer();

    return () => {
      mounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [movieId]);

  // Handle interaction & mouse move to show/hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying && !isHoveringControlsRef.current) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", () => {
        if (isPlaying && !isHoveringControlsRef.current) setShowControls(false);
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
    if (isLocked && !isHost) return; // Host lock enforced

    const pos = videoRef.current.currentTime;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      if (syncEnabled) {
        sync.play(pos);
      }
    } else {
      videoRef.current.pause();
      if (syncEnabled) {
        sync.pause(pos);
      }
    }
  }, [syncEnabled, isLocked, isHost, sync]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleDurationChange = () => {
    if (!videoRef.current) return;
    const d = videoRef.current.duration;
    // Only set duration if it's a valid finite number (HLS sometimes gives Infinity)
    if (d && isFinite(d) && d > 0) {
      setDuration(d);
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    if (isLocked && !isHost) return;

    // Guard against seeking beyond what's actually seekable
    const video = videoRef.current;
    let safeTime = time;
    if (video.seekable.length > 0) {
      const seekEnd = video.seekable.end(video.seekable.length - 1);
      safeTime = Math.max(0, Math.min(seekEnd, time));
    }

    video.currentTime = safeTime;
    setCurrentTime(safeTime);

    if (syncEnabled) {
      sync.seek(safeTime);
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

  const togglePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("Failed to toggle PiP:", err);
    }
  }, []);

  const handleQualityChange = (id: number) => {
    setCurrentQuality(id);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = id;
    }
  };

  const handleSubtitleChange = (id: number) => {
    setCurrentSubtitle(id);
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = id;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

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
        case "arrowleft":
          e.preventDefault();
          if (videoRef.current) {
            handleSeek(Math.max(0, videoRef.current.currentTime - 5));
          }
          break;
        case "arrowright":
          e.preventDefault();
          if (videoRef.current) {
            handleSeek(Math.min(duration, videoRef.current.currentTime + 5));
          }
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay, toggleFullscreen, duration]);

  if (error) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center bg-red-950/50 text-red-300 border border-red-800/50 p-6 rounded-2xl max-w-sm">
          <p className="font-semibold mb-3">{error}</p>
          <p className="text-sm text-red-400/70">Check the browser console for details.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden group select-none ${
        !showControls && isPlaying ? "cursor-none" : ""
      }`}
    >
      {(isLoading || isSeeking) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
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
        onLoadedMetadata={handleDurationChange}
        onSeeking={() => setIsSeeking(true)}
        onSeeked={() => setIsSeeking(false)}
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
        onPipToggle={togglePictureInPicture}
        isVisible={showControls || !isPlaying}
        subtitles={subtitles}
        currentSubtitle={currentSubtitle}
        onSubtitleChange={handleSubtitleChange}
        qualities={qualities}
        currentQuality={currentQuality}
        onQualityChange={handleQualityChange}
        playbackSpeed={playbackSpeed}
        onSpeedChange={handleSpeedChange}
        isLocked={isLocked}
        isHost={isHost}
        onShareTimestamp={() => {
          const timeStr = new Date(currentTime * 1000).toISOString().substr(11, 8).replace(/^00:/, '');
          sync.sendChatMessage(timeStr, "timestamp_share", currentTime);
        }}
        onMouseEnter={() => { isHoveringControlsRef.current = true; }}
        onMouseLeave={() => { isHoveringControlsRef.current = false; }}
      />
    </div>
  );
}
