import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Lock, MessageCircle, Play, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Watch Party | Sync Your Cinema",
  description: "A private, synchronized watch-party platform.",
};

export default function LandingPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-surface-base">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="orb-drift absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-700/10 blur-[105px]" />
        <div className="orb-drift absolute -right-20 top-36 h-[28rem] w-[28rem] rounded-full bg-brand-400/[0.07] blur-[130px]" style={{ animationDelay: "-5s" }} />
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(134,170,87,0.11),transparent_67%)]" />
      </div>
      <div className="noise pointer-events-none absolute inset-0 z-0 opacity-[0.022]" aria-hidden="true" />

      <nav className="relative z-20 mx-auto flex w-full max-w-[1480px] items-center justify-between border-b border-brand-100/10 px-6 py-5 md:px-10 lg:px-14">
        <Link href="/" className="group flex items-center gap-3" aria-label="Watch Party home">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-[11px] border border-brand-50/20 bg-gradient-brand shadow-brand transition duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
            <Play className="h-4 w-4 fill-[#15200f] text-[#15200f]" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-100 shadow-[0_0_12px_rgba(222,242,183,0.85)]" />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.03em] text-content-primary">Watch Party</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#experience" className="text-xs font-medium text-content-muted transition-colors hover:text-content-primary">Experience</Link>
          <Link href="#details" className="text-xs font-medium text-content-muted transition-colors hover:text-content-primary">Why Watch Party</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-content-secondary transition-colors hover:text-content-primary">Sign In</Link>
          <Link href="/library" className="btn-primary h-10 px-5 text-sm">Open Library</Link>
        </div>
      </nav>

      <section id="experience" className="relative z-10 mx-auto grid w-full max-w-[1480px] flex-1 items-center gap-16 px-6 py-16 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20 lg:px-14 lg:py-24">
        <div className="max-w-2xl text-left">
          <div className="reveal inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-500/[0.09] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200">
            <span className="live-pulse h-1.5 w-1.5 rounded-full bg-brand-200" />
            Your room, in sync
          </div>

          <h1 className="reveal reveal-1 mt-7 text-[3.7rem] font-semibold leading-[0.96] tracking-[-0.07em] text-content-primary sm:text-7xl lg:text-[6.7rem]">
            Keep the room.
            <span className="mt-2 block text-gradient">Lose the distance.</span>
          </h1>

          <p className="reveal reveal-2 mt-7 max-w-xl text-base leading-7 text-content-secondary sm:text-lg">
            Watch films with your people as if you were on the same sofa. Synchronized playback, private rooms, and a space that lets the story take over.
          </p>

          <div className="reveal reveal-3 mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link href="/library" className="btn-primary h-12 px-7 text-sm shadow-brand group">
              <Play className="h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" />
              Enter the Library
            </Link>
            <Link href="/register" className="glass flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-medium text-content-primary transition duration-300 hover:border-brand-300/30 hover:bg-brand-700/10">
              Create an Account
              <ArrowUpRight className="h-4 w-4 text-content-muted transition-transform duration-300 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="reveal reveal-4 mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[11px] font-medium uppercase tracking-[0.14em] text-content-muted">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-300" />No ads</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-300" />Private by design</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-300" />Made for friends</span>
          </div>
        </div>

        <div className="reveal reveal-2 relative mx-auto w-full max-w-[690px] lg:ml-auto">
          <div className="absolute -inset-10 rounded-[3.5rem] bg-brand-500/[0.08] blur-3xl" aria-hidden="true" />
          <div className="preview-float relative rounded-[2rem] border border-brand-100/[0.16] bg-[#0c150e]/90 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-300/20 bg-brand-500/10">
                  <Play className="h-3 w-3 fill-brand-200 text-brand-200" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-content-muted">Room / Friday night</p>
                  <p className="mt-1 text-xs font-medium text-content-primary">The quiet hours</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-brand-300/20 bg-brand-500/10 px-2.5 py-1 text-[10px] font-semibold text-brand-200">
                <span className="live-pulse h-1.5 w-1.5 rounded-full bg-brand-200" /> Live
              </span>
            </div>

            <div className="relative aspect-[1.48] overflow-hidden rounded-[1.35rem] border border-brand-100/[0.12] bg-[#1b2b1b]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(231,248,188,0.62),transparent_10%),radial-gradient(circle_at_36%_56%,rgba(169,209,119,0.3),transparent_27%),linear-gradient(128deg,#1a2518_15%,#617c43_50%,#152116_88%)]" />
              <div className="orb-drift absolute -right-8 top-3 h-56 w-56 rounded-full bg-brand-200/20 blur-2xl" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(6,13,8,0.86)_100%)]" />
              <div className="absolute left-7 top-7 flex items-center gap-2 rounded-full border border-white/15 bg-black/10 px-2.5 py-1.5 text-[9px] font-medium tracking-wide text-brand-50/80 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-brand-100" /> Film room
              </div>
              <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-brand-100/65">Now playing</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-brand-50">The quiet hours</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-[#1d3017] shadow-[0_8px_24px_rgba(0,0,0,0.24)] transition duration-300 hover:scale-105">
                  <Play className="h-4 w-4 fill-current" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pb-1 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c150e] bg-[#d5e6ad] text-[10px] font-bold text-[#334a20]">A</div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c150e] bg-[#9dbb72] text-[10px] font-bold text-[#26371d]">M</div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c150e] bg-[#68874a] text-[10px] font-bold text-brand-50">J</div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c150e] bg-surface-overlay text-[10px] font-semibold text-content-secondary">+2</div>
                </div>
                <span className="text-[11px] font-medium text-content-muted">5 friends watching</span>
              </div>
              <div className="flex items-center gap-1.5 text-content-muted">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-[10px]">Chat open</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 px-2 pb-1">
              <span className="text-[9px] tabular-nums text-content-muted">42:18</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-brand-100/10">
                <div className="progress-shimmer h-full w-[38%] rounded-full bg-gradient-to-r from-brand-300 to-brand-100" />
              </div>
              <span className="text-[9px] tabular-nums text-content-muted">1:51:04</span>
            </div>
          </div>
        </div>
      </section>

      <section id="details" className="relative z-10 mx-auto grid w-full max-w-[1480px] grid-cols-1 gap-4 px-6 pb-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
        <div className="card-hover reveal reveal-1 relative overflow-hidden p-7 sm:p-8">
          <div className="absolute right-6 top-6 text-4xl font-semibold tracking-[-0.1em] text-brand-300/[0.08]">01</div>
          <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-300/15 bg-brand-500/10">
            <Users className="h-[18px] w-[18px] text-brand-200" />
          </div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-content-primary">Everyone sees the same moment.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-content-secondary">Pause, play, and seek without the awkward countdown. The room moves together, naturally.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card-hover reveal reveal-2 relative overflow-hidden p-7">
            <div className="absolute right-5 top-5 text-3xl font-semibold tracking-[-0.1em] text-brand-300/[0.08]">02</div>
            <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-300/15 bg-brand-500/10">
              <Lock className="h-[18px] w-[18px] text-brand-200" />
            </div>
            <h2 className="text-base font-semibold tracking-[-0.03em] text-content-primary">Private by default.</h2>
            <p className="mt-3 text-sm leading-6 text-content-secondary">Rooms are made for your trusted circle, not the whole internet.</p>
          </div>
          <div className="card-hover reveal reveal-3 relative overflow-hidden p-7">
            <div className="absolute right-5 top-5 text-3xl font-semibold tracking-[-0.1em] text-brand-300/[0.08]">03</div>
            <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-300/15 bg-brand-500/10">
              <Sparkles className="h-[18px] w-[18px] text-brand-200" />
            </div>
            <h2 className="text-base font-semibold tracking-[-0.03em] text-content-primary">Less interface. More film.</h2>
            <p className="mt-3 text-sm leading-6 text-content-secondary">A calm, cinematic layer that stays out of the way when the story begins.</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1480px] items-center justify-between border-t border-brand-100/10 px-6 py-7 sm:px-10 lg:px-14">
        <p className="text-[11px] font-medium tracking-wide text-content-muted">© 2025 Watch Party</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-content-muted">A better way to be together</p>
      </footer>
    </main>
  );
}
