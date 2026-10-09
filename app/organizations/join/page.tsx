"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAppStore } from "@/store";
import { useRouter, useSearchParams } from "next/navigation";
import { mockInvitations, OrganizationInvitation } from "@/lib/mock-data/organizations";
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Shield,
  Building2,
  UserCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function JoinOrganizationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const { joinOrganization } = useAppStore();

  const [code, setCode] = useState(initialCode);
  const [matchedInvitation, setMatchedInvitation] = useState<OrganizationInvitation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setMatchedInvitation(null);
      setErrorMsg(null);
      return;
    }

    const found = (mockInvitations || []).find((inv) => inv?.code?.toUpperCase() === trimmed);
    if (found) {
      setMatchedInvitation(found);
      setErrorMsg(null);
    } else {
      setMatchedInvitation(null);
      if (trimmed.length >= 8) {
        setErrorMsg("Code not recognized. Valid mock codes: INV-TKR-2026, INV-ABC-CORP, INV-COMM-2026, INV-JURY-2026");
      } else {
        setErrorMsg(null);
      }
    }
  }, [code]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const res = joinOrganization(code);
      if (res.success) {
        setJoinSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setErrorMsg(res.message);
        setIsSubmitting(false);
      }
    }, 500);
  };

  const handleSelectMockCode = (mockCode: string) => {
    setCode(mockCode);
  };

  return (
    <div className="space-y-6">
      {joinSuccess ? (
        <div className="text-center p-12 rounded-2xl border border-emerald-500/40 bg-slate-900/90 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Membership Created Successfully!</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You joined <span className="text-indigo-400 font-semibold">{matchedInvitation?.organizationName}</span> with role <span className="text-emerald-400 font-semibold font-mono">{matchedInvitation?.invitedRole}</span>. Redirecting to Organization Dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleJoin} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Invitation Code *</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 12-character invitation code (e.g. INV-TKR-2026)"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 font-mono text-base uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600 placeholder:normal-case"
              />
              {matchedInvitation && (
                <div className="absolute right-3 top-3 flex items-center gap-1 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valid Code</span>
                </div>
              )}
            </div>
            {errorMsg && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
              Quick Test Invitation Codes:
            </span>
            <div className="flex flex-wrap gap-2">
              {(mockInvitations || []).map((inv) => (
                <button
                  key={inv.code}
                  type="button"
                  onClick={() => handleSelectMockCode(inv.code)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs font-mono transition cursor-pointer flex items-center gap-1.5",
                    code.toUpperCase() === inv.code
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  )}
                >
                  <span className="font-bold">{inv.code}</span>
                  <span className="text-[10px] text-slate-500">({inv.invitedRole})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Invitation Details Preview Card */}
          {matchedInvitation && (
            <div className="p-5 rounded-xl border border-indigo-500/30 bg-slate-950/70 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verified Invitation Details</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Expires: {new Date(matchedInvitation.expiresAt).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">Organization Name</span>
                  <span className="text-slate-100 font-bold text-sm block mt-0.5">
                    {matchedInvitation.organizationName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">Organization Type</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">
                    {matchedInvitation.organizationType} ({matchedInvitation.subtype})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">Invited Role</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {matchedInvitation.invitedRole}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">Invited By</span>
                  <span className="text-slate-300 font-medium block mt-0.5">
                    {matchedInvitation.invitedBy}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  The role for this organization is enforced cryptographically by this invitation. Self-selection of privileged administrative roles is disabled by design.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Link
              href="/workspace"
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !matchedInvitation}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <span>{isSubmitting ? "Accepting Membership..." : "Join Organization"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function JoinOrganizationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-mono">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm font-mono tracking-wider">EVENTOPS</span>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Organization Membership Portal
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 flex-1 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
            <KeyRound className="w-3.5 h-3.5" />
            <span>JOIN BY INVITATION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Join Organization</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter your official organization invitation code to activate your assigned role and access team operations.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Loading invitation portal...</div>}>
          <JoinOrganizationForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        EVENTOPS RBAC Multi-Tenant Platform • Zero Paperwork Guarantee
      </footer>
    </div>
  );
}
