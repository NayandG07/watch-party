import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Watch Party | Private Synchronized Cinema",
  description: "Host private, synchronized watch parties with friends directly from your own storage.",
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between bg-[#050505] text-zinc-100 overflow-hidden select-none">
      {/* Aurora Ambient Backgrounds */}
      <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-emerald-500/5 via-neutral-900/10 to-transparent blur-[100px] pointer-events-none" />

      {/* Spacer for Flex Justify */}
      <div className="h-10" />

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/60 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-400">
            Private Cinema Platform
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-light tracking-tight text-white mb-4">
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">Watch-Party</span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-500 max-w-md mb-10">
          Cinematic. Private. Synchronized.
        </p>

        <div className="w-full max-w-sm space-y-3">
          <input 
            type="text" 
            placeholder="ENTER ROOM CODE"
            className="w-full px-5 py-3.5 bg-zinc-900/60 border border-zinc-800 focus:border-amber-500 rounded-xl text-center text-sm tracking-wider font-mono text-white placeholder-zinc-600 outline-none transition-all duration-300 focus:ring-1 focus:ring-amber-500/20"
          />
          <Link 
            href="/login" 
            className="block w-full py-3.5 rounded-xl bg-white text-zinc-950 font-display font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-zinc-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg"
          >
            Access Platform
          </Link>
          <div className="pt-2">
            <Link href="/register" className="text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Request access or create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Trust Footer */}
      <footer className="relative z-10 text-[11px] text-zinc-700 text-center pb-8">
        Built for trusted friends. Zero tracking. Direct streaming.
      </footer>
    </main>
  );
}
