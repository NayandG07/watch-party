"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RegisterForm from "./register-form";
import { Suspense } from "react";

function RegisterContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") || searchParams.get("invite");

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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-brand shadow-[0_0_40px_rgba(124,47,247,0.4)] mb-6">
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
              <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center p-4 text-center">
                <span className="text-xs font-bold text-white/50 tracking-widest uppercase">RV Test Video</span>
              </div>
            </div>
            <div className="absolute glass w-44 h-60 rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-10 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-full h-full bg-gradient-to-tr from-brand-900/50 to-blue-900/50 flex items-center justify-center p-4 text-center">
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
            <h2 className="text-3xl font-bold text-content-primary tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-content-secondary">Join your private cinema</p>
          </div>

          <div className="glass p-8 shadow-card rounded-2xl border border-white/5">
            <RegisterForm inviteToken={inviteToken} />
          </div>

          <p className="text-center mt-8 text-sm text-content-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-surface-base">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
