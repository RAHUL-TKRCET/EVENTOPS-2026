"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth";
import { useAppStore } from "@/store";
import { ArrowRight, Building2, UserPlus, Info } from "lucide-react";

type AccountType = "ORGANIZATION_CREATOR" | "PARTICIPANT";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = (searchParams.get("eventId") || "").trim();
  const { setCurrentUser, setCurrentRole } = useAppStore();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(
    searchParams.get("accountType") === "PARTICIPANT" ? "PARTICIPANT" : "ORGANIZATION_CREATOR"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get("accountType") === "PARTICIPANT") {
      setAccountType("PARTICIPANT");
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const isOrganizationOwner = accountType === "ORGANIZATION_CREATOR";
      const role = isOrganizationOwner ? "ORGANIZATION_ADMIN" : "PARTICIPANT";
      const res = await authApi.register({
        name,
        email,
        password,
        role,
        ...(isOrganizationOwner ? { organizationName } : {}),
      });
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      if (isOrganizationOwner) {
        router.push("/dashboard");
      } else if (eventId) {
        // Account creation and event enrollment are separate operations.
        // Keep the event context and state plainly that enrollment is pending.
        router.push(`/events/registration-status?eventId=${encodeURIComponent(eventId)}&state=account-created`);
      } else {
        router.push("/participant");
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
      <div className="space-y-2 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-mono text-xl font-bold text-white shadow-lg shadow-indigo-500/30">EO</div>
        <h2 className="font-mono text-2xl font-bold tracking-tight text-white">Create EVENTOPS Account</h2>
        <p className="text-xs text-slate-400">
          {eventId
            ? `Create a participant account to continue with event ${eventId}. Account creation does not enroll you in the event.`
            : "Start an organization workspace or create a participant account."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { setAccountType("ORGANIZATION_CREATOR"); setErrorMsg(null); }}
          className={`cursor-pointer rounded-xl border p-4 text-left transition ${accountType === "ORGANIZATION_CREATOR" ? "border-indigo-500 bg-indigo-600/20 text-white" : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"}`}
        >
          <Building2 className="mb-2 h-5 w-5 text-indigo-400" />
          <div className="text-sm font-bold">Organization head</div>
          <div className="mt-1 text-xs text-slate-400">Create a new organization</div>
        </button>
        <button
          type="button"
          onClick={() => { setAccountType("PARTICIPANT"); setErrorMsg(null); }}
          className={`cursor-pointer rounded-xl border p-4 text-left transition ${accountType === "PARTICIPANT" ? "border-indigo-500 bg-indigo-600/20 text-white" : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"}`}
        >
          <UserPlus className="mb-2 h-5 w-5 text-indigo-400" />
          <div className="text-sm font-bold">Participant</div>
          <div className="mt-1 text-xs text-slate-400">Create a participant account</div>
        </button>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p>Event Admin, Judge, Volunteer, and staff access is granted through verified event assignments or administrator-managed invitations—not public self-registration.</p>
      </div>

      {errorMsg && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{errorMsg}</div>}

      <form onSubmit={handleRegister} className="space-y-4">
        <Input label="Full name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        {accountType === "ORGANIZATION_CREATOR" && (
          <Input label="Organization / institution name" required autoComplete="organization" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your college, company, or organization" />
        )}
        <Input label="Email address" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.com" />
        <Input label="Password (at least 8 characters)" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a secure password" />
        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} rightIcon={<ArrowRight className="h-4 w-4" />}>
          {isLoading ? "Creating account…" : accountType === "ORGANIZATION_CREATOR" ? "Create organization & continue" : "Create participant account"}
        </Button>
      </form>

      <div className="space-y-1 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
        <div>Already have an account? <Link href="/login" className="font-semibold text-indigo-400 hover:underline">Sign in</Link></div>
        <div className="text-[11px] text-slate-500">Account roles and organization access are verified by the backend.</div>
      </div>
    </div>
  );
}
