"use client";

import { useState, useRef, MouseEvent } from "react";
import Link from "next/link";
import { Play, Users, Shield, ArrowRight, Zap, Volume2, Maximize2 } from "lucide-react";

// ReactBits Spotlight Card Component
function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(245, 158, 11, 0.12)",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950/60 p-8 backdrop-blur-md transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/5 ${className}`}
    >
      {/* ReactBits Cursor Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function LandingPage() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <main className="min-h-dvh flex flex-col bg-[#050505] text-zinc-100 relative overflow-hidden select-none">
      {/* Background Grid Pattern & Glowing Orbs */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" 
      />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-[140px]" />

      {/* Top Header Navigation */}
      <nav className="relative z-30 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-[#050505] font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all">
            W
          </div>
          <span className="font-display text-lg font-bold text-white tracking-tight">
            WatchParty
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link 
            href="/library" 
            className="bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-[0.98]"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-20 text-center max-w-5xl mx-auto">
        {/* Synced Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-mono font-semibold text-zinc-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 uppercase tracking-wider text-[10px]">Synced Playback</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 text-[11px]">Private Cinema Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05] mb-6">
          Watch Together. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
            Perfectly In Sync.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
          Host private movie nights with your friends. Frame-accurate playback synchronization, real-time chat, and direct cloud streaming.
        </p>

        {/* Action CTAs */}
        <div className="flex items-center gap-4 flex-col sm:flex-row w-full sm:w-auto mb-16">
          <Link
            href="/library"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-sm uppercase tracking-wider px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all active:scale-[0.98] group"
          >
            <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
            <span>Enter the Library</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto bg-neutral-900/80 hover:bg-neutral-800 text-zinc-200 border border-neutral-800 font-display font-semibold text-sm px-8 py-3.5 rounded-xl flex items-center justify-center transition-all backdrop-blur-md"
          >
            Create Account
          </Link>
        </div>

        {/* Interactive Watch Room Preview Component */}
        <div className="w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
          {/* Subtle top glow line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-900 bg-neutral-900/40 rounded-xl mb-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="font-display font-bold text-white tracking-wide">Inception (2010) — Friday Movie Night</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                ● 4 VIEWERS IN SYNC
              </span>
            </div>
          </div>

          {/* Video Screen Simulation */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center group/screen border border-neutral-900">
            {/* Cinematic Gradient Simulation */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/30 opacity-90" />
            
            {/* Simulated Center Controls */}
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="relative z-20 w-16 h-16 rounded-full bg-amber-500/90 text-[#050505] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            </button>

            {/* Bottom HUD Bar */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 z-20">
              <div className="w-full h-1.5 rounded-full bg-white/20 relative overflow-hidden cursor-pointer">
                <div className="absolute left-0 top-0 bottom-0 w-[42%] bg-amber-500 rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>01:02:14 / 02:28:00</span>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400">1080p</span>
                  <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                  <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid with ReactBits Spotlight Cards */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Built for Trusted Friends
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 font-mono">
            Zero tracking • Invite-only • Direct storage streaming
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <SpotlightCard>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">
              Frame-Accurate Sync
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Playback timestamps are synchronized across clients using WebSockets. Everyone stays in sync automatically without manual counting down.
            </p>
          </SpotlightCard>

          <SpotlightCard>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">
              100% Private & Direct
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Media streams directly from Cloudflare-proxied Backblaze storage to viewers. No middleman servers proxying video data.
            </p>
          </SpotlightCard>

          <SpotlightCard>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">
              Invite-Only Rooms
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              No public discovery, feeds, or stranger access. Generate secure tokenized invite links for your group to join instantly.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 w-full py-8 text-center border-t border-neutral-900 bg-neutral-950/40 text-xs text-zinc-600">
        <p>&copy; 2026 WatchParty. Built for trusted friends.</p>
      </footer>
    </main>
  );
}
