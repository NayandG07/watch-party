import type { Metadata } from "next";
import Link from "next/link";
import { Play, Users, Lock, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Watch Party | Sync Your Cinema",
  description: "A private, synchronized watch-party platform.",
};

export default function LandingPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-surface-base">
      <div className="pointer-events-none absolute inset-0 -z-0 opacity-80" aria-hidden="true">
        <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-brand-700/10 blur-[110px]" />
        <div className="absolute -right-24 top-32 h-96 w-96 rounded-full bg-brand-400/10 blur-[130px]" />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-gradient-spotlight opacity-60" />
      </div>
      <div className="noise pointer-events-none absolute inset-0 z-0 opacity-[0.025]" aria-hidden="true" />

      {/* Top Navigation */}
      <nav className="relative z-20 flex w-full items-center justify-between border-b border-brand-100/10 px-6 py-5 md:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="Watch Party home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-brand transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
            <Play className="h-4 w-4 fill-[#16200f] text-[#16200f]" />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-content-primary">Watch Party</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm font-medium text-content-secondary transition-colors hover:text-content-primary">
            Sign In
          </Link>
          <Link href="/library" className="btn-primary h-10 px-5 text-sm">
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24">
        <div className="animate-fade-in text-left">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(177,209,122,0.75)]" />
            Private rooms · perfectly synced
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-content-primary sm:text-6xl lg:text-[5.4rem]">
            The cinema is better <span className="text-gradient">together.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-content-secondary sm:text-lg">
            Host private movie nights with friends. Enjoy flawless playback synchronization, real-time chat, and an ad-free cinematic experience.
          </p>

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link href="/library" className="btn-primary h-12 px-7 text-sm shadow-brand group">
              <Play className="mr-1.5 h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" />
              Enter the Library
            </Link>
            <Link href="/register" className="glass flex h-12 items-center rounded-xl px-7 text-sm font-medium text-content-primary transition-colors hover:border-brand-300/30 hover:bg-brand-700/10">
              Create an Account
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-content-muted">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-300" />No ads</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-300" />Invite-only</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-300" />Built for friends</span>
          </div>
        </div>

        {/* Static product preview — visual only, no new interaction */}
        <div className="relative hidden animate-scale-in lg:block" style={{ animationDelay: "120ms" }}>
          <div className="absolute -inset-8 rounded-[2.75rem] bg-brand-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-brand-100/15 bg-[#111911]/90 p-3 shadow-[0_26px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-content-muted">Room / Friday night</p>
                <p className="mt-1 text-sm font-medium text-content-primary">The quiet hours</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-brand-300/20 bg-brand-500/10 px-2.5 py-1 text-[10px] font-semibold text-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-300" /> Live
              </span>
            </div>
            <div className="relative aspect-[1.55] overflow-hidden rounded-[1.25rem] border border-brand-100/10 bg-gradient-to-br from-[#7b9f50] via-[#364f2e] to-[#172018]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(226,241,177,0.48),transparent_13%),linear-gradient(125deg,transparent_30%,rgba(10,16,11,0.55)_72%)]" />
              <div className="absolute left-6 top-6 h-16 w-16 rounded-full border border-brand-100/30 bg-brand-200/20 blur-[1px]" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-100/70">Now playing</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-brand-50">The quiet hours</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-[#26371d] shadow-lg">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pb-1 pt-4">
              <div className="flex -space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111911] bg-[#d5e6ad] text-[10px] font-bold text-[#334a20]">A</div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111911] bg-[#9dbb72] text-[10px] font-bold text-[#26371d]">M</div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111911] bg-[#68874a] text-[10px] font-bold text-brand-50">J</div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111911] bg-surface-overlay text-[10px] font-semibold text-content-secondary">+2</div>
              </div>
              <span className="text-[11px] font-medium text-content-muted">5 friends watching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-6 pb-20 sm:px-10 md:grid-cols-3 animate-fade-in" style={{ animationDelay: "180ms" }}>
        <div className="card-hover group relative overflow-hidden rounded-2xl p-6 md:-translate-y-3">
          <div className="absolute right-5 top-5 text-3xl font-semibold tracking-[-0.08em] text-brand-300/10">01</div>
          <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-300/15 bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
            <Users className="h-[18px] w-[18px] text-brand-300" />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-content-primary">Sync playback</h3>
          <p className="mt-2.5 text-sm leading-6 text-content-secondary">
            Pause, play, and seek perfectly in sync with everyone in the room.
          </p>
        </div>

        <div className="card-hover group relative overflow-hidden rounded-2xl p-6">
          <div className="absolute right-5 top-5 text-3xl font-semibold tracking-[-0.08em] text-brand-300/10">02</div>
          <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-300/15 bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
            <Lock className="h-[18px] w-[18px] text-brand-300" />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-content-primary">Invite-only by default</h3>
          <p className="mt-2.5 text-sm leading-6 text-content-secondary">
            Private rooms keep your media and movie nights inside your trusted circle.
          </p>
        </div>

        <div className="card-hover group relative overflow-hidden rounded-2xl p-6">
          <div className="absolute right-5 top-5 text-3xl font-semibold tracking-[-0.08em] text-brand-300/10">03</div>
          <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-300/15 bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
            <Sparkles className="h-[18px] w-[18px] text-brand-300" />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-content-primary">A calmer way to watch</h3>
          <p className="mt-2.5 text-sm leading-6 text-content-secondary">
            A focused interface that keeps the room, not the controls, at the center.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-brand-100/10 px-6 py-7 text-center sm:px-10">
        <p className="text-xs font-medium tracking-wide text-content-muted">© 2025 Watch Party · Built for trusted friends</p>
      </footer>
    </main>
  );
}
