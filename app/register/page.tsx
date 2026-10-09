"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth";
import { useAppStore } from "@/store";
import { ArrowRight, ShieldCheck, Mail, Building2, UserPlus, Info } from "lucide-react";
import { UserRole } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const { setCurrentUser, setCurrentRole } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"EVENT_ADMIN" | "ORGANIZATION_CREATOR" | "PARTICIPANT">("EVENT_ADMIN");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const assignedRole: UserRole =
        accountType === "EVENT_ADMIN"
          ? "EVENT_ADMIN"
          : accountType === "ORGANIZATION_CREATOR"
          ? "ORGANIZATION_ADMIN"
          : "PARTICIPANT";

      const res = await authApi.register({ name, email, password, role: assignedRole });
      setCurrentUser(res.user);
      setCurrentRole(assignedRole);

      if (accountType === "ORGANIZATION_CREATOR") {
        router.push("/onboarding");
      } else if (accountType === "EVENT_ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/participant");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg p-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-mono font-bold text-xl shadow-lg shadow-indigo-500/30">
          EO
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
          Create EventOps Account
        </h2>
        <p className="text-xs text-slate-400">
          Universal event operations SaaS platform for colleges, enterprises, and communities.
        </p>
      </div>

      {/* Account Type Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">Registration Role</label>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setAccountType("EVENT_ADMIN")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              accountType === "EVENT_ADMIN"
                ? "bg-indigo-600/20 border-indigo-500 text-white"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-indigo-400 mb-1" />
            <div className="text-xs font-bold leading-tight">Event Admin</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Direct Event Operations</div>
          </button>

          <button
            type="button"
            onClick={() => setAccountType("ORGANIZATION_CREATOR")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              accountType === "ORGANIZATION_CREATOR"
                ? "bg-indigo-600/20 border-indigo-500 text-white"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <Building2 className="w-5 h-5 text-indigo-400 mb-1" />
            <div className="text-xs font-bold leading-tight">Organization</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Campus / Company Host</div>
          </button>

          <button
            type="button"
            onClick={() => setAccountType("PARTICIPANT")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              accountType === "PARTICIPANT"
                ? "bg-indigo-600/20 border-indigo-500 text-white"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <UserPlus className="w-5 h-5 text-indigo-400 mb-1" />
            <div className="text-xs font-bold leading-tight">Participant</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Hackathons & Fests</div>
          </button>
        </div>
      </div>

      {/* Security notice regarding privileged roles */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Joining as Judge, Volunteer, or Staff?</span>
          <p className="mt-0.5 text-slate-400">
            Jury and staff roles are access-controlled via invitation tokens issued by your Event Director.
          </p>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Full Legal / Professional Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rachel Dupont"
        />

        <Input
          label="Work or Academic Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@organization.com"
        />

        <Input
          label="Choose Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {accountType === "EVENT_ADMIN"
            ? "Create Event Admin Account"
            : accountType === "ORGANIZATION_CREATOR"
            ? "Continue to Organization Setup"
            : "Create Participant Account"}
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 space-y-1">
        <div>
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
        <div className="text-[11px] text-slate-500">
          Strict Enterprise RBAC Enforcement • Team Panch Pandavs
        </div>
      </div>
    </div>
  );
}
