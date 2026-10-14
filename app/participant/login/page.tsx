"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, CircleAlert, KeyRound } from "lucide-react";

export default function ParticipantLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const eventId = (params.get("eventId") || "").trim();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { setCurrentUser, setCurrentRole } = useAppStore();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await authApi.login(email, password, "PARTICIPANT");
      setCurrentUser(session.user);
      setCurrentRole(session.user.role);
      router.push(eventId ? `/participant?eventId=${encodeURIComponent(eventId)}` : "/participant");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Sign-in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 flex items-center justify-center">
      <section className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8">
        <header>
          <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Participant access</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Participant login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use the login details sent to your email after event registration. Registration itself does not require sign-in.</p>
          {eventId && <p className="mt-3 break-all font-mono text-xs text-slate-500">Event ID: {eventId}</p>}
        </header>
        {error && <p role="alert" className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"><CircleAlert className="h-4 w-4 shrink-0" />{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <Input label="Participant email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="primary" className="w-full" isLoading={busy} disabled={busy} rightIcon={<ArrowRight className="h-4 w-4" />}>
            {busy ? "Signing in…" : "Sign in to participant space"}
          </Button>
        </form>
        <div className="border-t border-slate-800 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push(eventId ? `/events/portal?eventId=${encodeURIComponent(eventId)}` : "/events")} leftIcon={<KeyRound className="h-4 w-4" />}>Back to event portal</Button>
        </div>
      </section>
    </main>
  );
}
