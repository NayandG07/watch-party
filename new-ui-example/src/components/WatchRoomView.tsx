import React, { useState, useEffect, useRef } from "react";
import { AppView, Movie, RoomMember, ChatMessage } from "../types";
import { Play, Pause, Volume2, Maximize, MessageSquare, Settings, Users, Sparkles, Send, SkipForward, ArrowLeft, Info, HelpCircle } from "lucide-react";

interface WatchRoomViewProps {
  setView: (view: AppView) => void;
  movie: Movie;
}

export const WatchRoomView: React.FC<WatchRoomViewProps> = ({ setView, movie }) => {
  // Playback timer states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(42 * 60 + 15); // Start at 42:15
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [activeBuffer, setActiveBuffer] = useState<string | null>(null);

  // Selector dropdowns
  const [selectedQuality, setSelectedQuality] = useState("4K UHD");
  const [selectedSub, setSelectedSub] = useState("English (SRT)");
  const [selectedAudio, setSelectedAudio] = useState("English (Atmos 5.1)");

  // Active floating emojis lists
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; left: number }[]>([]);

  // Room members with sync state
  const [members, setMembers] = useState<RoomMember[]>([
    { name: "Ryan (You)", avatar: "RY", role: "Host", status: "synced", progress: 100 },
    { name: "Sarah Jenkins", avatar: "SJ", role: "Companion", status: "synced", progress: 100 },
    { name: "David Miller", avatar: "DM", role: "Companion", status: "synced", progress: 100 },
    { name: "Marcus Aurelius", avatar: "MA", role: "Companion", status: "synced", progress: 100 },
  ]);

  // Messages log
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "Sarah Jenkins", avatar: "SJ", text: "the visuals here are insane...", timestamp: "01:12:05" },
    { id: "2", sender: "David Miller", avatar: "DM", text: "Hans Zimmer really outdid himself with this cue.", timestamp: "01:12:44" },
    { id: "sys-1", sender: "System", avatar: "💻", text: "Marcus Aurelius synced up with room timeline.", timestamp: "01:13:02", isSystem: true },
  ]);

  // Timestamps bookmarks (Fight scene, Funny moments, Songs etc.)
  const bookmarks = [
    { label: "Introduction Scene", seconds: 120, type: "Story" },
    { label: "Desert Fight Sequence", seconds: 42 * 60 + 15, type: "Fight" },
    { label: "The Sandworm Ride", seconds: 90 * 60, type: "Climax" },
    { label: "Final Duel Confrontation", seconds: 152 * 60, type: "Action" },
  ];

  // Auto hiding timeline overlay controls after 5 seconds of inactivity
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4500);
  };

  useEffect(() => {
    window.addEventListener("mousemove", resetControlsTimeout);
    resetControlsTimeout();
    return () => {
      window.removeEventListener("mousemove", resetControlsTimeout);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Simulated player playback interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= movie.durationSeconds) {
            setIsPlaying(false);
            return movie.durationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, movie]);

  // Utility to format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours > 0 ? String(hours).padStart(2, "0") : null,
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() === "") return;

    const newMessage: ChatMessage = {
      id: String(Date.now()),
      sender: "Ryan (You)",
      avatar: "RY",
      text: chatMessage,
      timestamp: formatTime(currentTime),
    };

    setMessages((prev) => [...prev, newMessage]);
    setChatMessage("");
  };

  // Trigger floating reaction emojis inside player canvas
  const handleTriggerEmoji = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80% left
    setFloatingEmojis((prev) => [...prev, { id, char: emoji, left }]);

    // Auto cleanup floating emoji
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 3000);

    // Broadcast in Chat too!
    const emojiMessage: ChatMessage = {
      id: String(id),
      sender: "Ryan (You)",
      avatar: "RY",
      text: `reacted with ${emoji}`,
      timestamp: formatTime(currentTime),
    };
    setMessages((prev) => [...prev, emojiMessage]);
  };

  // Simulate remote user buffering event to demonstrate "Sync Timeline" behavior
  const triggerBufferSimulation = () => {
    setActiveBuffer("Marcus Aurelius");
    setMembers((prev) =>
      prev.map((m) =>
        m.name === "Marcus Aurelius" ? { ...m, status: "buffering", progress: 34 } : m
      )
    );

    // Slowly increment progress, then sync back!
    let progress = 34;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        clearInterval(interval);
        setActiveBuffer(null);
        setMembers((prev) =>
          prev.map((m) =>
            m.name === "Marcus Aurelius" ? { ...m, status: "synced", progress: 100 } : m
          )
        );
        // Add success log
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: "System",
            avatar: "💻",
            text: "Marcus Aurelius successfully synced. Drift compensated (0.1s).",
            timestamp: formatTime(currentTime),
            isSystem: true,
          },
        ]);
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.name === "Marcus Aurelius" ? { ...m, progress } : m
          )
        );
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-zinc-100 flex flex-col overflow-hidden select-none select-none font-sans">
      
      {/* Floating Reactions overlay inside player view */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {floatingEmojis.map((emoji) => (
          <div
            key={emoji.id}
            style={{ left: `${emoji.left}%` }}
            className="absolute bottom-32 text-4xl animate-float-up opacity-0 font-normal"
          >
            {emoji.char}
          </div>
        ))}
      </div>

      {/* TOP COMPONENT: WATCH ROOM HEADER NAVIGATION */}
      <nav
        className={`absolute top-0 inset-x-0 h-16 flex items-center justify-between px-8 bg-gradient-to-b from-black/90 to-transparent z-40 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setView("home")}
            className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors"
            title="Return Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase font-bold tracking-widest">Lobby</span>
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-baseline space-x-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">WATCH PARTY</span>
            <span className="text-zinc-700 text-xs">/</span>
            <span className="text-sm font-semibold tracking-tight text-zinc-200">
              {movie.title} ({movie.year})
            </span>
          </div>
        </div>

        {/* Sync Indicator and active stack */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              Sync Synced
            </span>
          </div>

          <button
            onClick={triggerBufferSimulation}
            className="px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-[9px] text-amber-400 hover:bg-amber-500/10 transition-all font-mono font-bold uppercase tracking-wider"
            title="Simulate buffer resolution flow"
          >
            Simulate Buffering Alert
          </button>
        </div>
      </nav>

      {/* MID COMPONENT: CINEMATIC THEATER SECTION */}
      <main className="flex-1 flex relative h-full">
        
        {/* PLAYER LEFT BOX */}
        <div className="flex-1 flex flex-col relative bg-black justify-center items-center">
          
          {/* Mock Video Backdrop canvas container */}
          <div className="absolute inset-0 w-full h-full bg-[#050505] overflow-hidden flex items-center justify-center">
            {/* Cinematic Gradient Backdrop Mesh */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1a120b] via-[#050505] to-[#0c0d16] opacity-80" />
            
            {/* Huge atmospheric title overlay */}
            <div className="text-center z-10 p-6 max-w-xl">
              <h2 className="text-5xl sm:text-7xl font-display font-black tracking-tighter text-zinc-100/15 italic select-none">
                {movie.title.toUpperCase()}
              </h2>
              <p className="text-[10px] tracking-[0.5em] text-zinc-500 uppercase mt-4 opacity-30 select-none">
                {movie.genre.join("  ·  ")}
              </p>

              {/* Display Buffer Spinner banner */}
              {activeBuffer && (
                <div className="mt-8 inline-flex items-center space-x-3 px-5 py-3 rounded-xl bg-zinc-950/80 border border-amber-500/20 shadow-2xl animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  <p className="text-xs text-amber-400 font-mono">
                    {activeBuffer} is buffering. Wait threshold compensation...
                  </p>
                </div>
              )}
            </div>

            {/* Simulated paused screen banner */}
            {!isPlaying && !activeBuffer && (
              <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center animate-in fade-in duration-200">
                <div className="p-6 rounded-2xl bg-zinc-950/90 border border-white/5 text-center shadow-2xl max-w-sm">
                  <Pause className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold">Room Paused by Host</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Timeline locked at {formatTime(currentTime)}. Resuming plays for everyone.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* LOWER HUD CONTROLLERS OVERLAY PANEL */}
          <div
            className={`absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-30 transition-all duration-300 ${
              showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
            }`}
          >
            {/* 1. SECTIONS / TIMELINE SLIDER WITH JUMP BOOKMARKS */}
            <div className="space-y-4">
              <div className="relative group">
                {/* Horizontal Progress line bar */}
                <div className="relative h-1 w-full bg-white/10 rounded-full cursor-pointer">
                  <div
                    style={{ width: `${(currentTime / movie.durationSeconds) * 100}%` }}
                    className="absolute h-full bg-zinc-300 rounded-full"
                  />
                  
                  {/* Floating Drag Dot */}
                  <div
                    style={{ left: `${(currentTime / movie.durationSeconds) * 100}%` }}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform -translate-x-1/2"
                  />
                </div>

                {/* Render colored bookmarks dots (Funny scenes, fight scenes, clips) */}
                {bookmarks.map((mark, index) => {
                  const leftPercentage = (mark.seconds / movie.durationSeconds) * 100;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentTime(mark.seconds);
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: String(Date.now()),
                            sender: "System",
                            avatar: "💻",
                            text: `Ryan jumped the room timeline to bookmark: "${mark.label}"`,
                            timestamp: formatTime(mark.seconds),
                            isSystem: true,
                          },
                        ]);
                      }}
                      style={{ left: `${leftPercentage}%` }}
                      className="absolute -top-1 w-2 h-2 rounded-full bg-amber-500 border border-black hover:scale-150 transition-transform"
                      title={`Timestamp: ${mark.label} (${mark.type})`}
                    />
                  );
                })}
              </div>

              {/* 2. PLAYER ACTIONS BAR */}
              <div className="flex items-center justify-between">
                
                {/* Left controls: Pause, volume, time indicators */}
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      // Add system alert message
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: String(Date.now()),
                          sender: "System",
                          avatar: "💻",
                          text: `Ryan ${isPlaying ? "paused" : "resumed"} the playback timeline.`,
                          timestamp: formatTime(currentTime),
                          isSystem: true,
                        },
                      ]);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-4 h-4 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
                    <div className="w-16 h-1 bg-white/20 rounded-full">
                      <div className="w-[80%] h-full bg-zinc-300 rounded-full" />
                    </div>
                  </div>

                  <span className="text-[11px] font-mono tracking-widest text-zinc-400">
                    {formatTime(currentTime)} / {formatTime(movie.durationSeconds)}
                  </span>
                </div>

                {/* Right controls: Quality, Subtitles, Stats toggle */}
                <div className="flex items-center space-x-6">
                  {/* Playback Stats Toggle */}
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className={`p-1.5 rounded hover:bg-white/5 transition-colors text-xs font-mono font-bold uppercase tracking-wider ${
                      showStats ? "text-amber-500" : "text-zinc-400 hover:text-white"
                    }`}
                    title="Toggle Technical Playback Status HUD"
                  >
                    Stats
                  </button>

                  {/* Subtitles dropdown selection */}
                  <div className="relative group">
                    <button className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white transition-colors uppercase font-mono font-bold tracking-widest">
                      <span>Sub:</span>
                      <span className="text-zinc-200 border border-white/20 px-1 py-0.5 rounded text-[9px]">
                        {selectedSub.split(" ")[0]}
                      </span>
                    </button>
                    {/* Hover dropdown list */}
                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-zinc-950 border border-white/10 rounded-xl p-2 hidden group-hover:block animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-2xl">
                      {movie.subtitleTracks.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSub(sub)}
                          className={`w-full text-left px-2 py-1 text-[10px] rounded transition-all font-mono uppercase ${
                            selectedSub === sub ? "text-amber-500 bg-white/5 font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality dropdown selection */}
                  <div className="relative group">
                    <button className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white transition-colors uppercase font-mono font-bold tracking-widest">
                      <span>Res:</span>
                      <span className="text-zinc-200 border border-white/20 px-1 py-0.5 rounded text-[9px]">
                        {selectedQuality}
                      </span>
                    </button>
                    {/* Hover dropdown list */}
                    <div className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-950 border border-white/10 rounded-xl p-2 hidden group-hover:block animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-2xl">
                      {["4K UHD", "1440p", "1080p", "720p", "Auto"].map((qual) => (
                        <button
                          key={qual}
                          onClick={() => setSelectedQuality(qual)}
                          className={`w-full text-left px-2 py-1 text-[10px] rounded transition-all font-mono uppercase ${
                            selectedQuality === qual ? "text-amber-500 bg-white/5 font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {qual}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Chat column */}
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`p-1 text-zinc-400 hover:text-white transition-colors ${
                      showChat ? "text-amber-500" : ""
                    }`}
                    title="Toggle Chat Sidebar"
                  >
                    <MessageSquare className="w-4.5 h-4.5" />
                  </button>

                  <Maximize className="w-4.5 h-4.5 text-zinc-400 hover:text-white cursor-pointer transition-colors" />
                </div>

              </div>
            </div>
          </div>

          {/* PLAYBACK DIAGNOSTICS STATS HUD CARD (Floating Left) */}
          {showStats && (
            <div className="absolute top-20 left-8 p-4 rounded-xl border border-white/15 bg-zinc-950/90 backdrop-blur-xl w-60 text-left font-mono text-[10px] text-zinc-400 space-y-2.5 z-30 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-white font-bold uppercase tracking-wider text-[9px]">Sync telemetry logs</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex justify-between">
                <span>Latency Drifts:</span>
                <span className="text-white font-bold">14 ms (Direct B2)</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Bitrate:</span>
                <span className="text-emerald-400 font-bold">42.5 Mbps</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Buffer Health:</span>
                <span className="text-white">98.2s cached ahead</span>
              </div>
              <div className="flex justify-between">
                <span>Time Drift Offset:</span>
                <span className="text-white">0.02s vs. master</span>
              </div>
              <div className="flex justify-between">
                <span>Stream Protocol:</span>
                <span className="text-zinc-500 uppercase">HLS / MP4 Remux</span>
              </div>
            </div>
          )}

        </div>

        {/* SIDEBAR RIGHT CHAT COLUMN (THE CIRCLE) */}
        {showChat && (
          <aside className="w-80 border-l border-white/5 bg-[#080808]/95 backdrop-blur-md flex flex-col justify-between z-30 animate-in slide-in-from-right-4 duration-300">
            
            {/* Header: Room Members List */}
            <div className="p-6 border-b border-white/5 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  The Sync Circle
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                  {members.length} watching
                </span>
              </div>

              {/* Members horizontal avatars layout */}
              <div className="mt-4 space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                {members.map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 text-[9px] font-bold flex items-center justify-center text-white">
                        {m.avatar}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-semibold text-zinc-200">{m.name}</p>
                        <p className="text-[9px] text-zinc-500 leading-none">{m.role}</p>
                      </div>
                    </div>

                    {/* Show live buffering progress tags if buffering */}
                    {m.status === "buffering" ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-mono text-amber-500 animate-pulse">
                          Buffering ({m.progress}%)
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      </div>
                    ) : (
                      <span className="text-[9px] font-mono text-emerald-500">
                        Synced
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Stream Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className="text-left animate-in fade-in duration-200">
                  {msg.isSystem ? (
                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                        <span className="text-amber-500 font-bold uppercase tracking-tighter">Sync:</span> {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 text-zinc-200">
                        {msg.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] font-bold text-zinc-300">{msg.sender}</span>
                          <span className="text-[8px] font-mono text-zinc-600">{msg.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed break-words">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Emoji Panel & Form message trigger input */}
            <div className="p-6 border-t border-white/5 space-y-4 bg-black/40">
              
              {/* Emojis floating triggers */}
              <div className="flex items-center justify-between px-2">
                {["🔥", "😮", "💀", "👏", "🍿"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleTriggerEmoji(emoji)}
                    className="text-lg grayscale hover:grayscale-0 hover:scale-125 transition-all outline-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Whisper to group..."
                  className="w-full bg-zinc-900 border-none rounded-full pl-4 pr-10 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-white/10 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-1.5 rounded-full text-zinc-500 hover:text-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </aside>
        )}

      </main>

    </div>
  );
};
