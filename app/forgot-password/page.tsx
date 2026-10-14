"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setMessage("");
    // Do not claim an email was sent until a secure backend recovery flow exists.
    setMessage("Password recovery is not configured for this deployment. No email or verification code was sent.");
    setChecking(false);
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
      <div className="space-y-2">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition hover:text-indigo-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>
        <h1 className="font-mono text-xl font-bold tracking-tight text-white">Password Recovery</h1>
        <p className="text-xs text-slate-400">Enter your registered email to check recovery availability.</p>
      </div>
      {message && <div role="status" className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Registered account email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={checking}>Check recovery availability</Button>
      </form>
    </div>
  );
}
