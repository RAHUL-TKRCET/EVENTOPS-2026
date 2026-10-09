"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth";
import { CheckCircle2, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    await authApi.resetPassword(password);
    setIsLoading(false);
    setIsSuccess(true);
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white font-mono">
          Set New Password
        </h2>
        <p className="text-xs text-slate-400">
          Must be at least 8 characters with enterprise complexity.
        </p>
      </div>

      {isSuccess ? (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 space-y-3 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="font-semibold text-sm">Credentials Updated</h4>
          <p className="text-xs text-emerald-300/80">
            Your password has been changed. You can now login.
          </p>
          <Button
            size="md"
            variant="primary"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Go to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
          <Input
            label="New Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Update Password & Login
          </Button>
        </form>
      )}
    </div>
  );
}
