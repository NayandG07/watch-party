"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck, RefreshCw } from "lucide-react";
import api, { getErrorMessage, tokenStorage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setIsVerifying(true);
    setError(null);
    try {
      const { data } = await api.post<{
        access_token: string;
        user: import("@/stores/authStore").User;
      }>("/api/auth/verify-email", { email, otp: code });
      tokenStorage.set(data.access_token);
      useAuthStore.getState().setUser(data.user);
      toast.success("Email verified! Welcome to Watch Party 🎉");
      router.push("/library");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post("/api/auth/resend-verification", { email });
      toast.success("New code sent! Check your inbox.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.every(d => d !== "")) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <main className="min-h-dvh flex items-center justify-center bg-surface-base overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md px-6 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand shadow-brand flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">Check your email</h1>
          <p className="text-sm text-content-secondary mt-2">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-content-primary">{email || "your email"}</span>.
            <br />Enter it below to verify your account.
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="glass p-8 rounded-2xl border border-white/5 shadow-card space-y-6">
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={isVerifying}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-surface-border bg-surface-elevated text-content-primary focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.some(d => d === "")}
            className="btn-primary w-full h-11 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</>
            ) : (
              "Verify Email"
            )}
          </button>
        </div>

        {/* Resend */}
        <div className="text-center mt-6 text-sm text-content-muted">
          Didn&apos;t receive a code?{" "}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors inline-flex items-center gap-1"
          >
            {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Resend code
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-surface-base">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}