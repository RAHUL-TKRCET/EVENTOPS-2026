"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export default function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setMessage("OTP verification is not configured. No code was validated and you cannot proceed to password reset.");
    setChecking(false);
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400"><ShieldCheck className="h-6 w-6" /></div>
        <h1 className="font-mono text-xl font-bold text-white">Verification</h1>
        <p className="text-xs text-slate-400">A verified recovery challenge is required before password reset.</p>
      </div>
      {message && <div role="status" className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{message}</div>}
      <form onSubmit={handleVerify} className="space-y-4">
        <Input label="Registered account email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Six-digit code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} />
        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={checking}>Check verification availability</Button>
      </form>
    </div>
  );
}
