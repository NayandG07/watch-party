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
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-brand shadow-brand">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-content-primary tracking-tight">Watch Party</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">
            Sign In
          </Link>
          <Link href="/library" className="btn-primary h-10 px-6 text-sm">
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 z-10 text-center animate-fade-in">
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
          <Link href="/library" className="btn-primary h-12 px-8 text-base shadow-brand">
            <Play className="w-5 h-5 mr-2 fill-current" />
            Enter the Library
          </Link>
          <Link href="/register" className="glass h-12 px-8 rounded-xl font-medium text-content-primary hover:bg-white/5 transition-colors flex items-center border border-white/10">
            Create an Account
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="glass p-8 rounded-3xl border border-white/5 bg-white/5">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6">
            <Users className="w-6 h-6 text-brand-400" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-3">Sync Playback</h3>
          <p className="text-content-secondary leading-relaxed">
            Pause, play, and seek perfectly in sync with everyone in the room. No more counting down &ldquo;3, 2, 1, play&rdquo;.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 bg-white/5">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6">
            <Lock className="w-6 h-6 text-brand-400" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-3">100% Private</h3>
          <p className="text-content-secondary leading-relaxed">
            Invite-only rooms. Your media is streamed securely from your own Cloudflare-proxied Backblaze storage.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 bg-white/5">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6">
            <Sparkles className="w-6 h-6 text-brand-400" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-3">Sleek Design</h3>
          <p className="text-content-secondary leading-relaxed">
            A beautiful, distraction-free cinematic interface built for maximum immersion and ease of use.
          </p>
        </div>
      </section>
    </main>
  );
}
