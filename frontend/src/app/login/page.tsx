import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Watch Party account.",
};

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-surface-base relative overflow-hidden">
      {/* Ambient glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-800/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        {/* Logo / brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand shadow-brand mb-5">
            {/* Play icon */}
            <svg
              className="w-7 h-7 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-content-primary tracking-tight">
            Watch Party
          </h1>
          <p className="mt-2 text-sm text-content-secondary">
            Sign in to your private cinema
          </p>
        </div>

        {/* Login card */}
        <div className="glass p-8 shadow-card">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-content-muted">
          Don&apos;t have an account?{" "}
          <span className="text-content-secondary">
            Ask an admin for an invite link.
          </span>
        </p>
      </div>
    </main>
  );
}
