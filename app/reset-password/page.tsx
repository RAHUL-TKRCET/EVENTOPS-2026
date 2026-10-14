"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertTriangle, ArrowLeft, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("Password recovery is not configured. A verified, expiring recovery challenge is required before changing a password.");

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"><ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In</Link>
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400"><Lock className="h-6 w-6" /></div>
        <h1 className="font-mono text-xl font-bold text-white">Set New Password</h1>
        <p className="text-xs text-slate-400">This action requires a verified recovery challenge.</p>
      </div>
      <div role="status" className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{message}</div>
      <p className="text-xs text-slate-500">No password was changed.</p>
    </div>
  );
}
