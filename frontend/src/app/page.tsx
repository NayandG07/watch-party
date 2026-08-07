import type { Metadata } from "next";
import Link from "next/link";
import { Play, Users, ShieldCheck, Sparkles, Film, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Watch Party | Private Synchronized Cinema",
  description: "Host private, synchronized watch parties with friends directly from your own storage.",
};

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col bg-surface-base relative overflow-hidden">
      {/* Top Navigation */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl p-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500 text-white shadow-brand group-hover:bg-brand-600 transition-colors">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
          <span className="text-xl font-bold text-content-primary tracking-tight">Watch Party</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost h-10 px-4 text-sm font-semibold text-content-secondary hover:text-content-primary">
            Sign In
          </Link>
          <Link href="/library" className="btn-primary h-10 px-5 text-sm font-bold shadow-brand">
            Start watching
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 z-10 text-center animate-fade-in max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Private & Synchronized Co-Watching</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-content-primary tracking-tight max-w-4xl leading-[1.15] mb-6">
          Watch Movies Together, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-500">
            Perfectly In Sync.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-content-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
          Host private movie nights with friends. Zero buffering delays, real-time chat, and crisp playback without middleman servers.
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="flex items-center gap-4 flex-col sm:flex-row mb-12">
          <Link href="/library" className="btn-primary h-12 px-8 text-base font-bold shadow-brand group">
            <Play className="w-5 h-5 mr-2 fill-current transition-transform duration-300 group-hover:scale-110" />
            Start watching
          </Link>
          <Link href="/register" className="btn-secondary h-12 px-8 text-base font-semibold text-content-primary border border-slate-300 hover:bg-slate-50 transition-colors">
            Create an account
          </Link>
        </div>

        {/* Trust Messaging */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/80 border border-slate-200/80 px-4 py-2 rounded-full shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Your media stays in your storage — videos are never proxied or stored on our servers.</span>
        </div>

        {/* Hero Poster Banner Showcase */}
        <div className="w-full mt-14 relative rounded-3xl overflow-hidden border border-slate-200 shadow-card-hover bg-white p-3">
          <div className="aspect-[21/9] rounded-2xl bg-slate-900 relative overflow-hidden flex items-center justify-center">
            {/* Cinematic Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/80" />
            
            {/* Poster Collage Background Graphic */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay flex gap-4 p-4 overflow-hidden pointer-events-none">
              <div className="w-1/5 rounded-xl bg-gradient-to-b from-brand-600 to-indigo-900 aspect-[2/3] shrink-0 transform -rotate-3" />
              <div className="w-1/5 rounded-xl bg-gradient-to-b from-amber-600 to-accent-700 aspect-[2/3] shrink-0 transform rotate-2" />
              <div className="w-1/5 rounded-xl bg-gradient-to-b from-blue-600 to-slate-900 aspect-[2/3] shrink-0" />
              <div className="w-1/5 rounded-xl bg-gradient-to-b from-purple-700 to-indigo-950 aspect-[2/3] shrink-0 transform -rotate-2" />
              <div className="w-1/5 rounded-xl bg-gradient-to-b from-rose-600 to-slate-900 aspect-[2/3] shrink-0 transform rotate-3" />
            </div>

            {/* Play Overlay Preview Card */}
            <div className="relative z-10 text-center p-6 text-white max-w-lg">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cinematic Sync Engine</h3>
              <p className="text-xs text-white/80">Sub-second synchronization across desktop, tablet, and mobile web browsers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Explanation Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-content-primary tracking-tight mb-3">How Watch Party Works</h2>
          <p className="text-content-secondary max-w-xl mx-auto">Get started in three simple steps — no downloads or plugins required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs font-extrabold uppercase tracking-widest text-brand-600 bg-brand-50 inline-flex self-start px-3 py-1 rounded-full mb-6">
              Step 01
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mb-5 text-brand-700">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-content-primary mb-2">1. Choose a movie</h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Browse your personal cloud library or connect your Backblaze B2 storage bucket to pick your title.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs font-extrabold uppercase tracking-widest text-accent-600 bg-accent-50 inline-flex self-start px-3 py-1 rounded-full mb-6">
              Step 02
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accent-100 flex items-center justify-center mb-5 text-accent-700">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-content-primary mb-2">2. Create an invite-only room</h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Generate a secure room link with password options. Only guests with your invite link can join.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card relative overflow-hidden flex flex-col justify-between">
            <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 inline-flex self-start px-3 py-1 rounded-full mb-6">
              Step 03
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5 text-emerald-700">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-content-primary mb-2">3. Watch together in sync</h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Press play, seek, or pause — everyone&apos;s video player updates instantaneously with integrated live chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4 text-brand-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-2">Private by design</h3>
          <p className="text-sm text-content-secondary leading-relaxed">
            Your media stays in your own cloud storage. Streaming data is delivered straight to room participants without centralized data collection or video transcoding proxies.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mb-4 text-accent-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-content-primary mb-2">Zero Hassle Syncing</h3>
          <p className="text-sm text-content-secondary leading-relaxed">
            Automatic drift detection keeps all viewers within milliseconds of the room host. If someone buffers, the player catches them up smoothly.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
        <p className="text-sm text-content-muted">© 2026 Watch Party. Private, synchronized cinema for trusted friends.</p>
      </footer>
    </main>
  );
}
