import React, { useState } from "react";
import { AppView } from "../types";
import { Key, Mail, User, ShieldCheck, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";

interface AuthProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const AuthViews: React.FC<AuthProps> = ({ currentView, setView }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [inviteCode, setInviteCode] = useState("friend-invite-2026");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setView("home");
    }, 1500);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setView("login");
    }, 2000);
  };

  const containerClasses = "min-h-screen w-full flex items-center justify-center bg-stone-50 dark:bg-[#050505] text-stone-900 dark:text-zinc-100 p-4 transition-colors duration-300 relative select-none";

  const cardClasses = "w-full max-w-md bg-white dark:bg-neutral-950 border border-stone-200 dark:border-neutral-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-all";

  // Aurora light effect inside cards
  const cardGradientOverlay = (
    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500/80 via-yellow-400 to-emerald-500/80" />
  );

  if (currentView === "login") {
    return (
      <div className={containerClasses}>
        {/* Subtle decorative grid in light mode or gradient in dark */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        <div className={cardClasses}>
          {cardGradientOverlay}
          <div className="flex flex-col items-center text-center mb-6">
            <button onClick={() => setView("splash")} className="absolute left-6 top-6 text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-sm mb-3">W</div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">Access your private synchronized watch room</p>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce mb-2" />
              <p className="text-sm font-semibold">Decrypting user workspace...</p>
              <p className="text-xs text-stone-400 mt-1">Connecting Backblaze sync nodes</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot-password")}
                    className="text-[11px] text-amber-600 dark:text-amber-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-[#050505] font-display font-bold text-sm tracking-wide transition-all shadow-lg"
              >
                Sign In to Room
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-stone-500">
            <span>Don't have an account? </span>
            <button onClick={() => setView("register")} className="text-amber-600 dark:text-amber-400 hover:underline font-semibold">
              Register here
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "register") {
    return (
      <div className={containerClasses}>
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        <div className={cardClasses}>
          {cardGradientOverlay}
          <div className="flex flex-col items-center text-center mb-6">
            <button onClick={() => setView("login")} className="absolute left-6 top-6 text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-sm mb-3">W</div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Create Account</h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">Claim your spot on the private screen network</p>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce mb-2" />
              <p className="text-sm font-semibold">Account created successfully!</p>
              <p className="text-xs text-stone-400 mt-1">Preparing private workspace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Invite Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3.5 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter Invite Verification Tag"
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-emerald-500/30 rounded-xl text-sm font-mono text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Desired Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="screen_friend"
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-[#050505] font-display font-bold text-sm tracking-wide transition-all shadow-lg"
              >
                Register & Initialize
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-stone-500">
            <span>Already have an account? </span>
            <button onClick={() => setView("login")} className="text-amber-600 dark:text-amber-400 hover:underline font-semibold">
              Log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "forgot-password") {
    return (
      <div className={containerClasses}>
        <div className={cardClasses}>
          {cardGradientOverlay}
          <div className="flex flex-col items-center text-center mb-6">
            <button onClick={() => setView("login")} className="absolute left-6 top-6 text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-sm mb-3">W</div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Recover Access</h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">We will send you a secure credential decryption hook</p>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
              <p className="text-sm font-semibold">Decryption hook broadcasted!</p>
              <p className="text-xs text-stone-400">Check your secure mailbox for access. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-[#050505] font-display font-bold text-sm tracking-wide transition-all shadow-lg"
              >
                Send Decryption Link
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (currentView === "accept-invitation") {
    return (
      <div className={containerClasses}>
        <div className={cardClasses}>
          {cardGradientOverlay}
          <div className="flex flex-col items-center text-center mb-6">
            <button onClick={() => setView("splash")} className="absolute left-6 top-6 text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-amber-500 flex items-center justify-center font-bold text-sm mb-3">SJ</div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Sarah Invited You</h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">Claim your access invitation to <b>The Screening Room</b></p>
          </div>

          <div className="p-4 rounded-xl bg-stone-100 dark:bg-neutral-900/60 border border-stone-200 dark:border-neutral-900 text-xs text-stone-600 dark:text-zinc-300 italic mb-6 leading-relaxed">
            "Hey! Set up your account and let's watch some Ghibli classics and sci-fi movies together this week! No server setup needed on your end, it streams right from my B2 bucket."
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                Pre-Approved Invite Code
              </label>
              <input
                type="text"
                disabled
                value="GHIBLI-FRIEND-ACTIVE-2026"
                className="w-full px-4 py-3 bg-stone-200 dark:bg-neutral-900 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                Set Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cozy_friend"
                className="w-full px-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-[#050505] font-display font-bold text-sm tracking-wide transition-all shadow-lg"
            >
              Accept & Sign Up
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
