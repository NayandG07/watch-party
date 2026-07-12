"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import api, { getErrorMessage, tokenStorage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: { id: string; username: string; role: string };
}

interface Props {
  inviteToken: string;
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
        invite_token: inviteToken,
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      tokenStorage.set(data.access_token);
      
      // Update auth store with the newly fetched user
      useAuthStore.getState().setUser(data.user as any);
      
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
        <label htmlFor="reg-username" className="text-sm font-medium text-content-secondary">
          Username
        </label>
        <input
          id="reg-username"
          type="text"
          autoComplete="username"
          autoFocus
          required
          value={form.username}
          onChange={update("username")}
          placeholder="Choose a username"
          className="input"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="text-sm font-medium text-content-secondary">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
          placeholder="your@email.com"
          className="input"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="text-sm font-medium text-content-secondary">
          Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            placeholder="At least 8 characters"
            className="input pr-11"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-confirm" className="text-sm font-medium text-content-secondary">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="reg-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            placeholder="Repeat your password"
            className={cn(
              "input pr-11",
              form.confirmPassword.length > 0 &&
                !passwordsMatch &&
                "border-danger/50 focus:border-danger focus:ring-danger/30"
            )}
            disabled={isLoading}
          />
          {passwordsMatch && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
          )}
        </div>
        {form.confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-danger">Passwords do not match</p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger animate-fade-in">
          {error}
        </div>
      )}

      <button
        id="register-submit"
        type="submit"
        disabled={isLoading || !form.username || !form.email || !form.password || !passwordsMatch}
        className="btn-primary w-full mt-2 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
