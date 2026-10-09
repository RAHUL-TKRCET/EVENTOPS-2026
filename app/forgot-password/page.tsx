"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await authApi.forgotPassword(email);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md space-y-6">
      <div className="space-y-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-white font-mono">
          Reset EventOps Credentials
        </h2>
        <p className="text-xs text-slate-400">
          Enter your registered email and we will send you a one-time OTP recovery link.
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Recovery Dispatched</span>
          </div>
          <p className="text-xs text-emerald-300/80">
            A temporary 6-digit verification code has been dispatched to {email || "your email"}.
          </p>
          <Button
            size="sm"
            variant="success"
            className="w-full"
            onClick={() => router.push("/verify-otp")}
          >
            Enter Verification OTP
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Verified Account Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex.sterling@eventops.io"
          />

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Send OTP Verification
          </Button>
        </form>
      )}
    </div>
  );
}
