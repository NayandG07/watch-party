"use client";

import { useState, useRef, MouseEvent } from "react";
import Link from "next/link";
import { Play, Users, Shield, ArrowRight, Zap } from "lucide-react";

// ReactBits Spotlight Card Component
function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(245, 158, 11, 0.10)",
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
      className={`relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950/70 p-8 backdrop-blur-md transition-all duration-300 hover:border-amber-500/30 hover:shadow-2xl ${className}`}
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
  return (
    <main className="min-h-dvh flex flex-col bg-[#050505] text-zinc-100 relative overflow-hidden select-none">
      {/* Background Matrix Pattern & Ambient Glow */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" 
      />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-[140px]" />

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
      <section className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center max-w-4xl mx-auto">
        {/* Synced Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-mono font-semibold text-zinc-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 uppercase tracking-wider text-[10px]">Private Cinema Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6">
          Watch Movies Together. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
            Perfectly In Sync.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          Frame-accurate synchronized playback and real-time chat for your group. Direct object storage streaming with zero tracking.
        </p>

        {/* Action CTAs */}
        <div className="flex items-center gap-4 flex-col sm:flex-row w-full sm:w-auto mb-12">
          <Link
            href="/library"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-[#050505] font-display font-bold text-sm uppercase tracking-wider px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all active:scale-[0.98] group"
          >
            <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
            <span>Enter the Library</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto bg-neutral-900/80 hover:bg-neutral-800 text-zinc-200 border border-neutral-800 font-display font-semibold text-sm px-8 py-3.5 rounded-xl flex items-center justify-center transition-all backdrop-blur-md"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature Grid with ReactBits Spotlight Cards */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <SpotlightCard>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">
              Frame-Accurate Sync
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Playback timestamps are synchronized automatically across all viewers using WebSockets. No more counting down to hit play.
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
              Media streams directly from Cloudflare-proxied Backblaze storage to viewers. No middleman backend servers proxying video data.
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
