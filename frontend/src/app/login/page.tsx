import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./login-form";
import { Sparkles, Play } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In | Watch Party",
  description: "Sign in to your private Watch Party cinema.",
};

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex bg-surface-base overflow-hidden">
      {/* Left Decorative Panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-slate-900 border-r border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        
        {/* Subtle background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-12 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand shadow-brand flex items-center justify-center mb-6">
            <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Watch Party</h1>
          <p className="text-base text-slate-300 mb-10 max-w-sm">
            Private synchronized cinema. Watch videos together with instant state sync and chat.
          </p>

          {/* Floating Movie Posters Preview */}
          <div className="relative h-60 w-full flex items-center justify-center mb-8">
            <div className="absolute w-36 h-52 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden -rotate-6 -translate-x-20 flex flex-col justify-end p-3 text-left">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <span className="relative z-10 text-xs font-bold text-white">Interstellar</span>
              <span className="relative z-10 text-[10px] text-amber-300 font-semibold">4K UHD</span>
            </div>
            <div className="absolute w-40 h-56 rounded-2xl bg-brand-900 border border-brand-500/40 shadow-2xl overflow-hidden z-10 flex flex-col justify-end p-4 text-left">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="relative z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-400 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </div>
              <span className="relative z-10 text-sm font-extrabold text-white">Dune: Part Two</span>
            </div>
            <div className="absolute w-36 h-52 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden rotate-6 translate-x-20 flex flex-col justify-end p-3 text-left">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <span className="relative z-10 text-xs font-bold text-white">Oppenheimer</span>
              <span className="relative z-10 text-[10px] text-slate-300 font-medium">1080p</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Encrypted direct-to-client video streaming</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-surface-base p-6 sm:p-12 relative">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-brand shadow-brand mb-4">
              <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-content-secondary">Sign in to your Watch Party room</p>
          </div>

          {/* Form Card */}
          <div className="card p-6 sm:p-8">
            <LoginForm />
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-sm text-content-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-600 hover:text-brand-700 font-bold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
