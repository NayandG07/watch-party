import type { Metadata } from "next";
import Link from "next/link";
import { Play, Users, Lock, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Watch Party | Sync Your Cinema",
  description: "A private, synchronized watch-party platform.",
};

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col bg-surface-base relative overflow-hidden">
      {/* Top Navigation */}
      <nav className="relative z-20 w-full px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-brand shadow-brand group-hover:shadow-[0_0_20px_rgba(124,47,247,0.5)] transition-shadow duration-300">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-content-primary tracking-tight">Watch Party</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">
            Sign In
          </Link>
          <Link href="/library" className="btn-primary h-10 px-6 text-sm group">
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 z-10 text-center animate-fade-in">
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 noise opacity-[0.03] pointer-events-none" aria-hidden="true" />
        
        {/* Ambient background gradients */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-500/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-700/10 rounded-full blur-[120px]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Ultimate Co-Watching Experience</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-content-primary tracking-tight max-w-4xl leading-[1.1] mb-6">
          Watch Together, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">Perfectly In Sync.</span>
        </h1>

        <p className="text-lg md:text-xl text-content-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Host private movie nights with friends. Flawless playback synchronization, real-time chat, and an ad-free cinematic experience.
        </p>

        <div className="flex items-center gap-4 flex-col sm:flex-row">
          <Link href="/library" className="btn-primary h-12 px-8 text-base shadow-brand group">
            <Play className="w-5 h-5 mr-2 fill-current transition-transform duration-300 group-hover:scale-110" />
            Enter the Library
          </Link>
          <Link href="/register" className="glass h-12 px-8 rounded-xl font-medium text-content-primary hover:bg-white/5 transition-colors flex items-center border border-white/10 group">
            Create an Account
          </Link>
        </div>

        {/* Animated film-strip SVG decoration */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden h-12 opacity-20 pointer-events-none" aria-hidden="true">
          <div className="flex w-[200%] animate-slide-in-right" style={{ animationDuration: '20s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }}>
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex-shrink-0 flex items-center gap-2 mx-2">
                <div className="w-2 h-2 rounded-sm bg-brand-500" />
                <div className="w-2 h-2 rounded-sm bg-brand-500" />
                <div className="w-16 h-8 border border-brand-500 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="glass p-8 rounded-3xl border border-white/5 bg-white/5 ring-1 ring-brand-500/20 md:-translate-y-4 shadow-2xl shadow-brand-500/10 relative overflow-hidden">
          <div className="absolute top-6 right-6 tabular-nums text-4xl font-black text-brand-500/10">01</div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6 relative z-10">
            <Users className="w-6 h-6 text-brand-400" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-3">Sync Playback</h3>
          <p className="text-content-secondary leading-relaxed">
            Pause, play, and seek perfectly in sync with everyone in the room. No more counting down &ldquo;3, 2, 1, play&rdquo;.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 bg-white/5 relative overflow-hidden">
          <div className="absolute top-6 right-6 tabular-nums text-4xl font-black text-brand-500/10">02</div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6 relative z-10">
            <Lock className="w-6 h-6 text-brand-400" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-3">100% Private</h3>
          <p className="text-content-secondary leading-relaxed">
            Invite-only rooms. Your media is streamed securely from your own Cloudflare-proxied Backblaze storage.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 bg-white/5 relative overflow-hidden">
          <div className="absolute top-6 right-6 tabular-nums text-4xl font-black text-brand-500/10">03</div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6 relative z-10">
            <Sparkles className="w-6 h-6 text-brand-400" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-3">Sleek Design</h3>
          <p className="text-content-secondary leading-relaxed">
            A beautiful, distraction-free cinematic interface built for maximum immersion and ease of use.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-surface-border">
        <p className="text-sm text-content-muted">© 2025 Watch Party. Built for trusted friends.</p>
      </footer>
    </main>
  );
}
