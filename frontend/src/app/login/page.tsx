import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign In | Watch Party",
  description: "Sign in to your private Watch Party cinema.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-stone-50 dark:bg-[#050505] text-stone-900 dark:text-zinc-100 p-4 transition-colors duration-300 relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-stone-200 dark:border-neutral-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-all z-10">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500/80 via-yellow-400 to-emerald-500/80" />
        
        <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-white mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-stone-500 dark:text-zinc-500 mb-6">
          Sign in to your private screening room
        </p>

        <LoginForm />

        <div className="mt-6 text-center text-sm text-stone-500 dark:text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 font-semibold transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
