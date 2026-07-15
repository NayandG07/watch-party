import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "./register-form";


export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Watch Party account with an invite link.",
};

interface RegisterPageProps {
  searchParams: { token?: string };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const token = searchParams.token ?? null;

  return (
    <main className="min-h-dvh flex items-center justify-center bg-surface-base relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand shadow-brand mb-5">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-content-primary tracking-tight">Join Watch Party</h1>
          <p className="mt-2 text-sm text-content-secondary">Create your account</p>
        </div>

        <div className="glass p-8 shadow-card">
          <RegisterForm inviteToken={token} />
        </div>

        <p className="text-center mt-6 text-xs text-content-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
