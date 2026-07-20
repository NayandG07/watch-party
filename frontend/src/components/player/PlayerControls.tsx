import React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Subtitles, Share } from "lucide-react";
import { formatDuration } from "@/lib/utils";

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
  
  isVisible: boolean;
  
  onShareTimestamp?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

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
  isVisible,
  onShareTimestamp,
  onMouseEnter,
  onMouseLeave
}: PlayerControlsProps) {
  
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragValue, setDragValue] = React.useState(0);

  // Sync internal drag value with currentTime when not dragging
  React.useEffect(() => {
    if (!isDragging) {
      setDragValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDragValue(parseFloat(e.target.value));
  };
  
  const handleSeekMouseUp = () => {
    setIsDragging(false);
    onSeek(dragValue);
  };

  const handleSeekMouseDown = () => {
    setIsDragging(true);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute bottom-0 left-0 right-0 px-6 py-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)"
      }}
    >
      {/* Seek Bar */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-white/90 text-sm font-medium tabular-nums w-12 text-right">
          {formatDuration(isDragging ? dragValue : currentTime)}
        </span>
        
        <div className="flex-1 relative group cursor-pointer h-5 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={isDragging ? dragValue : currentTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            onTouchStart={handleSeekMouseDown}
            onTouchEnd={handleSeekMouseUp}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          {/* Track Background */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden pointer-events-none">
            {/* Progress Fill */}
            <div 
              className="h-full bg-brand-500 rounded-full transition-all duration-75"
              style={{ width: `${duration ? ((isDragging ? dragValue : currentTime) / duration) * 100 : 0}%` }}
            />
          </div>
          {/* Thumb */}
          <div 
            className="absolute h-3.5 w-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 pointer-events-none"
            style={{ left: `${duration ? ((isDragging ? dragValue : currentTime) / duration) * 100 : 0}%` }}
          />
        </div>

        <span className="text-white/90 text-sm font-medium tabular-nums w-12 text-left">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button 
            onClick={onPlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </button>
          
          {/* Volume */}
          <div className="flex items-center gap-2 group relative">
            <button 
              onClick={onMuteToggle}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 flex items-center">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 accent-brand-500 bg-white/20 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtitles (Placeholder) */}
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <Subtitles className="w-5 h-5" />
          </button>
          
          {/* Settings (Placeholder) */}
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Share Timestamp */}
          {onShareTimestamp && (
            <button 
              onClick={onShareTimestamp}
              title="Share current timestamp"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
            >
              <Share className="w-5 h-5" />
            </button>
          )}

          {/* Fullscreen */}
          <button 
            onClick={onFullscreenToggle}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
