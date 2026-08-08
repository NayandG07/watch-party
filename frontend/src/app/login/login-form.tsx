"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import api, { getErrorMessage, tokenStorage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";


interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post<LoginResponse>("/api/auth/login", {
        username: username.trim(),
        password,
      });

      tokenStorage.set(data.access_token);
      
      // Update auth store with the newly fetched user
      useAuthStore.getState().setUser(data.user as unknown as import("@/stores/authStore").User);
      
      router.push("/library");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Username */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-username"
          className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5"
        >
          Username
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-zinc-500" />
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-zinc-500" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full pl-10 pr-11 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-500 dark:text-rose-400 animate-fade-in"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        id="login-submit"
        type="submit"
        disabled={isLoading || !username.trim() || !password}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-[#050505] font-display font-bold text-sm tracking-wide uppercase transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            SIGNING IN…
          </>
        ) : (
          "SIGN IN"
        )}
      </button>
    </form>
  );
}
