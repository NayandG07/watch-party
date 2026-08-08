"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, User, Mail, Lock, Key } from "lucide-react";
import api, { getErrorMessage, tokenStorage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: { id: string; username: string; role: string };
}

interface Props {
  inviteToken: string | null;
}

export default function RegisterForm({ inviteToken }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post<RegisterResponse>("/api/auth/register", {
        ...(inviteToken ? { invite_token: inviteToken } : {}),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      tokenStorage.set(data.access_token);
      
      // Update auth store with the newly fetched user
      useAuthStore.getState().setUser(data.user as unknown as import("@/stores/authStore").User);
      
      router.push("/library");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="reg-username" className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
          Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-zinc-500" />
          <input
            id="reg-username"
            type="text"
            autoComplete="username"
            autoFocus
            required
            value={form.username}
            onChange={update("username")}
            placeholder="Choose a username"
            className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-zinc-500" />
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="your@email.com"
            className="w-full pl-10 pr-4 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-zinc-500" />
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            placeholder="At least 8 characters"
            className="w-full pl-10 pr-11 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-confirm" className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-zinc-500" />
          <input
            id="reg-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            placeholder="Repeat your password"
            className={cn(
              "w-full pl-10 pr-11 py-3 bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 outline-none focus:border-amber-500 transition-all",
              form.confirmPassword.length > 0 &&
                !passwordsMatch &&
                "border-rose-500 dark:border-rose-500 focus:border-rose-500"
            )}
            disabled={isLoading}
          />
          {passwordsMatch && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          )}
        </div>
        {form.confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-rose-500 dark:text-rose-400">Passwords do not match</p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-500 dark:text-rose-400 animate-fade-in">
          {error}
        </div>
      )}

      <button
        id="register-submit"
        type="submit"
        disabled={isLoading || !form.username || !form.email || !form.password || !passwordsMatch}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-[#050505] font-display font-bold text-sm uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            CREATING ACCOUNT…
          </>
        ) : (
          "CREATE ACCOUNT"
        )}
      </button>
    </form>
  );
}
