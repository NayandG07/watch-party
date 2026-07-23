"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Subtitles, Share, PictureInPicture, Check, Lock
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export interface QualityOption {
  id: number;
  name: string;
}

export interface SubtitleOption {
  id: number;
  name: string;
}

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;

  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;

  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;

  isFullscreen: boolean;
  onFullscreenToggle: () => void;

  onPipToggle?: () => void;

  isVisible: boolean;

  // Subtitles
  subtitles?: SubtitleOption[];
  currentSubtitle?: number;
  onSubtitleChange?: (id: number) => void;

  // Quality
  qualities?: QualityOption[];
  currentQuality?: number;
  onQualityChange?: (id: number) => void;

  // Playback Speed
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;

  // Lock status
  isLocked?: boolean;
  isHost?: boolean;

  onShareTimestamp?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerControls({
  isPlaying,
  onPlayPause,
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
  currentTime,
  duration,
  onSeek,
  isFullscreen,
  onFullscreenToggle,
  onPipToggle,
  isVisible,
  subtitles = [],
  currentSubtitle = -1,
  onSubtitleChange,
  qualities = [],
  currentQuality = -1,
  onQualityChange,
  playbackSpeed = 1,
  onSpeedChange,
  isLocked = false,
  isHost = true,
  onShareTimestamp,
  onMouseEnter,
  onMouseLeave,
}: PlayerControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  // Use a ref to store the drag value so we always read the latest value in event handlers
  // without relying on React's batched re-render state. This avoids the controlled-input
  // race condition where target.value may have already reverted to currentTime on mouseUp.
  const dragValueRef = useRef(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState(0);

  // Menus state
  const [activeMenu, setActiveMenu] = useState<"none" | "settings" | "subtitles">("none");
  const [settingsSubMenu, setSettingsSubMenu] = useState<"main" | "speed" | "quality">("main");

  const menuRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);

  // Sync internal drag value with currentTime when not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragValue(currentTime);
      dragValueRef.current = currentTime;
    }
  }, [currentTime, isDragging]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu("none");
        setSettingsSubMenu("main");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    dragValueRef.current = val; // update ref immediately (no batching delay)
    setDragValue(val);
  };

  const handleSeekMouseDown = () => {
    setIsDragging(true);
  };

  const handleSeekMouseUp = () => {
    // Read from ref — guaranteed to have the latest drag position,
    // even if React hasn't flushed the state update for dragValue yet.
    const val = dragValueRef.current;
    setIsDragging(false);
    if (isControlDisabled) return;
    if (duration > 0 && !isNaN(val)) {
      const clamped = Math.max(0, Math.min(duration, val));
      onSeek(clamped);
    }
  };

  const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !duration) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleSeekBarMouseLeave = () => {
    setHoverTime(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  const isControlDisabled = isLocked && !isHost;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute bottom-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4 transition-opacity duration-300 z-30 ${
        isVisible || activeMenu !== "none" ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
      }}
    >
      {/* ── Popover Menus Container ───────────────────────────────────────── */}
      {activeMenu !== "none" && (
        <div
          ref={menuRef}
          className="absolute bottom-16 right-6 bg-[#18181c] border border-white/10 rounded-2xl shadow-2xl p-3 min-w-[200px] text-xs text-white z-40 animate-fade-in backdrop-blur-md"
        >
          {/* Subtitles Menu */}
          {activeMenu === "subtitles" && (
            <div>
              <div className="font-semibold text-white/50 px-2 py-1 mb-1 border-b border-white/10 uppercase tracking-wider text-[10px]">
                Subtitles
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    onSubtitleChange?.(-1);
                    setActiveMenu("none");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                    currentSubtitle === -1 ? "bg-brand-500/20 text-brand-300 font-semibold" : "hover:bg-white/8 text-white/70"
                  }`}
                >
                  <span>Off</span>
                  {currentSubtitle === -1 && <Check className="w-3.5 h-3.5" />}
                </button>
                {subtitles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSubtitleChange?.(s.id);
                      setActiveMenu("none");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      currentSubtitle === s.id ? "bg-brand-500/20 text-brand-300 font-semibold" : "hover:bg-white/8 text-white/70"
                    }`}
                  >
                    <span>{s.name}</span>
                    {currentSubtitle === s.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Menu */}
          {activeMenu === "settings" && (
            <div>
              {settingsSubMenu === "main" && (
                <div className="space-y-1">
                  <button
                    onClick={() => setSettingsSubMenu("speed")}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/8 flex items-center justify-between transition-colors text-white/80"
                  >
                    <span>Playback Speed</span>
                    <span className="text-white/40">{playbackSpeed}x</span>
                  </button>
                  {qualities.length > 0 && (
                    <button
                      onClick={() => setSettingsSubMenu("quality")}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/8 flex items-center justify-between transition-colors text-white/80"
                    >
                      <span>Quality</span>
                      <span className="text-white/40">
                        {qualities.find((q) => q.id === currentQuality)?.name || "Auto"}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Speed Submenu */}
              {settingsSubMenu === "speed" && (
                <div>
                  <button
                    onClick={() => setSettingsSubMenu("main")}
                    className="font-semibold text-white/40 hover:text-white px-2 py-1 mb-1 border-b border-white/10 flex items-center gap-1 transition-colors text-[10px]"
                  >
                    ← Speed
                  </button>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          onSpeedChange?.(speed);
                          setActiveMenu("none");
                          setSettingsSubMenu("main");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                          playbackSpeed === speed ? "bg-brand-500/20 text-brand-300 font-semibold" : "hover:bg-white/8 text-white/70"
                        }`}
                      >
                        <span>{speed === 1 ? "1.0x (Normal)" : `${speed}x`}</span>
                        {playbackSpeed === speed && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Submenu */}
              {settingsSubMenu === "quality" && (
                <div>
                  <button
                    onClick={() => setSettingsSubMenu("main")}
                    className="font-semibold text-white/40 hover:text-white px-2 py-1 mb-1 border-b border-white/10 flex items-center gap-1 transition-colors text-[10px]"
                  >
                    ← Quality
                  </button>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {qualities.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          onQualityChange?.(q.id);
                          setActiveMenu("none");
                          setSettingsSubMenu("main");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                          currentQuality === q.id ? "bg-brand-500/20 text-brand-300 font-semibold" : "hover:bg-white/8 text-white/70"
                        }`}
                      >
                        <span>{q.name}</span>
                        {currentQuality === q.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Seek Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-white/80 text-xs font-medium tabular-nums w-10 text-right shrink-0">
          {formatDuration(isDragging ? dragValue : currentTime)}
        </span>

        <div
          ref={seekBarRef}
          onMouseMove={handleSeekBarMouseMove}
          onMouseLeave={handleSeekBarMouseLeave}
          className="flex-1 relative group cursor-pointer h-6 flex items-center"
        >
          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 transform -translate-x-1/2 bg-black/90 text-white text-[11px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-20 border border-white/10"
              style={{ left: `${hoverPos}%` }}
            >
              {formatDuration(hoverTime)}
            </div>
          )}

          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            disabled={isControlDisabled || !duration || duration <= 0}
            value={isDragging ? dragValue : currentTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            onTouchStart={handleSeekMouseDown}
            onTouchEnd={handleSeekMouseUp}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />

          {/* Track Background */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden pointer-events-none group-hover:h-2 transition-all">
            {/* Progress Fill */}
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-75"
              style={{ width: `${duration ? ((isDragging ? dragValue : currentTime) / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Thumb */}
          <div
            className="absolute h-3.5 w-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${duration ? ((isDragging ? dragValue : currentTime) / duration) * 100 : 0}%` }}
          />
        </div>

        <span className="text-white/80 text-xs font-medium tabular-nums w-10 text-left shrink-0">
          {formatDuration(duration)}
        </span>
      </div>

      {/* ── Controls Row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            disabled={isControlDisabled}
            title={isControlDisabled ? "Room is locked by host" : isPlaying ? "Pause (Space)" : "Play (Space)"}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isControlDisabled ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group relative">
            <button
              onClick={onMuteToggle}
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="w-0 overflow-hidden group-hover:w-20 sm:group-hover:w-24 transition-all duration-300 flex items-center">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1.5 accent-brand-500 bg-white/20 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Subtitles */}
          {subtitles.length > 0 && (
            <button
              onClick={() => {
                setActiveMenu(activeMenu === "subtitles" ? "none" : "subtitles");
                setSettingsSubMenu("main");
              }}
              title="Subtitles"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                currentSubtitle !== -1 ? "bg-brand-500/30 text-brand-300" : "hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              <Subtitles className="w-4 h-4" />
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => {
              setActiveMenu(activeMenu === "settings" ? "none" : "settings");
              setSettingsSubMenu("main");
            }}
            title="Settings (Speed & Quality)"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              activeMenu === "settings" ? "bg-white/15 text-white" : "hover:bg-white/10 text-white/70 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Picture-in-Picture */}
          {onPipToggle && (
            <button
              onClick={onPipToggle}
              title="Picture in Picture"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>
          )}

          {/* Share Timestamp */}
          {onShareTimestamp && (
            <button
              onClick={onShareTimestamp}
              title="Share current timestamp to chat"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <Share className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={onFullscreenToggle}
            title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
