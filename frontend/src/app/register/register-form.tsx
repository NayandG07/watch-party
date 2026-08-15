"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function RegisterForm() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    success: false,
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
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            username: form.username.trim().toLowerCase(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Supabase sent a magic/confirmation link. Show success message instead of redirecting.
      setForm((prev) => ({ ...prev, success: true }));
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (form.success) {
    return (
      <div className="text-center space-y-4 py-8 animate-fade-in">
        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold text-content-primary">Check your email</h3>
        <p className="text-content-secondary text-sm">
          We sent a confirmation link to <strong className="text-content-primary">{form.email}</strong>.
          Click the link to activate your account.
        </p>
      </div>
    );
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
