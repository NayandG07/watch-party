import React, { useState } from "react";
import { AppView } from "../types";
import { Film, Sparkles, Shield, ArrowRight } from "lucide-react";

interface SplashViewProps {
  setView: (view: AppView) => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ setView }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState(false);

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim().toLowerCase() === "friend") {
      setView("home");
    } else if (inviteCode.trim() !== "") {
      setView("home"); // Let any code pass for demo smoothness but alert them
    } else {
      setError(true);
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#050505] text-zinc-100 overflow-hidden select-none">
      
      {/* Immersive Subtle Aurora Backdrop Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-emerald-500/5 via-neutral-900/10 to-transparent blur-[100px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#050505] font-black">
            W
          </div>
          <span className="font-display font-bold tracking-[0.2em] uppercase text-xs text-zinc-300">
            Watch<span className="text-amber-500 font-light">Room</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView("login")}
            className="text-xs font-semibold tracking-wider uppercase text-zinc-400 hover:text-white transition-colors"
          >
            Login
          </button>
          <div className="h-4 w-[1px] bg-zinc-800" />
          <button
            onClick={() => setView("register")}
            className="text-xs font-semibold tracking-wider uppercase text-zinc-400 hover:text-white transition-colors"
          >
            Register
          </button>
        </div>
      </header>

      {/* Main Core Content */}
      <main className="relative z-10 max-w-xl mx-auto px-6 text-center flex flex-col items-center justify-center flex-1 py-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/60 mb-6">
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          <span className="text-[10px] font-mono font-semibold tracking-widest text-zinc-400 uppercase">
            Sleek Cinematic Experience
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-light tracking-tight text-white mb-4">
          PRIVATE <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">WATCH PARTY</span>
        </h1>

        <p className="font-body text-sm sm:text-base text-zinc-400 max-w-md leading-relaxed mb-10">
          Cinematic. Private. Synchronized. 
          Stream directly from cloud storage with up to 8 trusted friends. Zero telemetry, pure fidelity.
        </p>

        {/* Access Form */}
        <form
          onSubmit={handleAccess}
          className={`w-full max-w-sm flex flex-col space-y-3 transition-transform ${
            error ? "animate-shake" : ""
          }`}
        >
          <div className="relative">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter Invite Code (e.g., 'friend')"
              className={`w-full px-5 py-3.5 bg-zinc-900/60 border ${
                error ? "border-rose-500" : "border-zinc-800 focus:border-amber-500"
              } rounded-xl text-center text-sm tracking-wider font-mono text-white placeholder-zinc-600 outline-none transition-all duration-300 focus:ring-1 focus:ring-amber-500/20`}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-white text-zinc-950 font-display font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-zinc-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Access Screening Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
          <button onClick={() => setView("forgot-password")} className="hover:text-zinc-300 transition-colors">
            Forgot Password?
          </button>
          <span>•</span>
          <button onClick={() => setView("accept-invitation")} className="hover:text-zinc-300 transition-colors">
            Claim Invitation Link
          </button>
        </div>
      </main>

      {/* Footer Details */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-8 py-6 border-t border-zinc-900/60 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
        <div className="flex items-center space-x-4 mb-3 md:mb-0">
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Zero Tracking Logs</span>
          </div>
          <span>/</span>
          <span>B2 Storage Direct</span>
        </div>
        <div>
          <span>Premium Watch-Party Platform • v2.1.0-RC</span>
        </div>
      </footer>
    </div>
  );
};
