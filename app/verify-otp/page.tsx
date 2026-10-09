"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["8", "4", "2", "1", "9", "0"]);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await authApi.verifyOtp("user@example.com", otp.join(""));
    setIsLoading(false);
    router.push("/reset-password");
  };

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white font-mono">
          Security OTP Verification
        </h2>
        <p className="text-xs text-slate-400">
          Enter the 6-digit confirmation code generated for your session.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              className="w-11 h-12 text-center text-lg font-mono font-bold bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Confirm & Proceed
        </Button>
      </form>
    </div>
  );
}
