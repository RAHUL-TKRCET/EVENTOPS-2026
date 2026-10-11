"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { invitationsApi, InvitationVerification, AcceptedInvitation } from "@/lib/api/invitations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";

function readTokenFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token")?.trim() || "";
}

export default function AcceptInvitationPage() {
  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState<InvitationVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState<AcceptedInvitation | null>(null);

  useEffect(() => {
    const initialToken = readTokenFromLocation();
    setToken(initialToken);
    if (!initialToken) {
      setInvitation({ valid: false, message: "This invitation link is missing its token." });
      setIsVerifying(false);
      return;
    }
    let cancelled = false;
    invitationsApi.verify(initialToken)
      .then((result) => { if (!cancelled) setInvitation(result); })
      .catch((err: unknown) => {
        if (!cancelled) {
          setInvitation({ valid: false, message: err instanceof Error ? err.message : "Unable to verify this invitation." });
        }
      })
      .finally(() => { if (!cancelled) setIsVerifying(false); });
    return () => { cancelled = true; };
  }, []);

  const handleAccept = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !invitation?.valid) return;
    setIsSubmitting(true);
    setError("");
    try {
      const result = await invitationsApi.accept({
        token,
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(password ? { password } : {}),
      });
      setAccepted(result);
    } catch (err: unknown) {
      setError(err instanceof Error
        ? err.message
        : "The invitation could not be accepted. If you are creating a new account, enter your name and choose a password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginHref = accepted ? `../events/${encodeURIComponent(accepted.eventId)}/login` : "";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">EVENTOPS · Secure invitation</p>
          <h1 className="text-3xl font-bold tracking-tight">Join your event</h1>
          <p className="text-sm leading-6 text-slate-400">Review the invitation details before activating your event role.</p>
        </header>

        <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-8">
          {isVerifying ? (
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-400" role="status">
              <LoaderCircle className="h-5 w-5 animate-spin" /> Verifying invitation…
            </div>
          ) : accepted ? (
            <div className="space-y-5 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Invitation accepted</h2>
              <p className="text-sm leading-6 text-slate-300">{accepted.message}</p>
              <p className="text-xs text-slate-400">Your {accepted.role.replaceAll("_", " ").toLowerCase()} assignment is now active. Email delivery is not configured, so no confirmation email was sent by this flow.</p>
              <Button onClick={() => { window.location.href = loginHref; }} className="w-full">Continue to event login</Button>
            </div>
          ) : !invitation?.valid ? (
            <div className="space-y-3 py-4 text-center">
              <CircleAlert className="mx-auto h-10 w-10 text-rose-400" />
              <h2 className="text-lg font-semibold">Invitation unavailable</h2>
              <p className="text-sm leading-6 text-slate-400">{invitation?.message || "This invitation is invalid, expired, or has already been used."}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="text-xs uppercase tracking-wider text-slate-500">Invited to</div>
                <h2 className="text-lg font-semibold text-white">{invitation.eventName || "Event"}</h2>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Organization</div>
                    <div className="mt-1 text-slate-200">{invitation.organizationName || "Organization"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Assigned role</div>
                    <div className="mt-1 font-medium text-indigo-200">{invitation.role?.replaceAll("_", " ")}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-slate-500">Invitation email</div>
                    <div className="mt-1 break-all text-slate-200">{invitation.email}</div>
                  </div>
                  {invitation.expiresAt && (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-slate-500">Expires</div>
                      <div className="mt-1 text-slate-300">{new Date(invitation.expiresAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleAccept} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-white">Activate your access</h3>
                  <p className="text-xs leading-5 text-slate-400">If this email already has an EVENTOPS account, the name and password fields may be left blank. For a new account, provide both below.</p>
                </div>
                <Input label="Full name (new accounts)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" />
                <Input label="Create password (new accounts)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
                {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
                <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>Accept invitation</Button>
              </form>
            </>
          )}
        </section>
        <p className="text-center text-xs text-slate-600">Invitation tokens are single-use and expire after seven days. Never share this link with anyone else.</p>
      </div>
    </main>
  );
}
