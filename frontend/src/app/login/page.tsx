import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Watch Party account.",
};

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex bg-surface-base overflow-hidden">
      {/* Left Panel - Hidden on Mobile */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-surface-base border-r border-surface-border overflow-hidden">
        {/* Animated gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '4s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-12">
          {/* Logo & Brand */}
          <div className="mb-16 flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-brand shadow-[0_0_40px_rgba(184,107,72,0.35)] mb-6">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-content-primary tracking-tight mb-2">Watch Party</h1>
            <p className="text-lg text-content-secondary">Your private cinema experience.</p>
          </div>

          {/* Floating Movie Cards */}
          <div className="relative h-64 w-full flex items-center justify-center mb-12">
            <div className="absolute glass w-40 h-56 rounded-2xl border border-white/10 shadow-2xl overflow-hidden -rotate-2 -translate-x-24 animate-float">
              <div className="w-full h-full bg-gradient-to-br from-[#4a3b33] to-[#171514] flex items-center justify-center p-4 text-center">
                <span className="text-xs font-bold text-white/50 tracking-widest uppercase">RV Test Video</span>
              </div>
            </div>
            <div className="absolute glass w-44 h-60 rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-10 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-full h-full bg-gradient-to-tr from-brand-900/60 to-[#4a352a]/80 flex items-center justify-center p-4 text-center">
                <span className="text-xs font-bold text-white/70 tracking-widest uppercase">Interstellar</span>
              </div>
            </div>
            <div className="absolute glass w-40 h-56 rounded-2xl border border-white/10 shadow-2xl overflow-hidden rotate-1 translate-x-24 animate-float" style={{ animationDelay: '1s' }}>
              <div className="w-full h-full bg-gradient-to-bl from-orange-900/40 to-red-900/40 flex items-center justify-center p-4 text-center">
                <span className="text-xs font-bold text-white/50 tracking-widest uppercase">Dune</span>
              </div>
            </div>
          </div>

          <p className="text-content-muted italic text-sm">&quot;Watch together, perfectly in sync.&quot;</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-surface-default relative">
        <div className="w-full max-w-md px-6 animate-fade-in">
          <div className="text-center mb-10">
            {/* Mobile-only logo */}
            <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand shadow-brand mb-5">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-content-primary tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-content-secondary">Sign in to your private cinema</p>
          </div>

          <div className="glass p-8 shadow-card rounded-2xl border border-white/5">
            <LoginForm />
          </div>

          <p className="text-center mt-8 text-sm text-content-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
