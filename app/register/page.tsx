"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth";
import { useAppStore } from "@/store";
import { ArrowRight, Building2, CircleAlert, LoaderCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = (searchParams.get("eventId") || "").trim();
  const legacyParticipantLink = searchParams.get("accountType") === "PARTICIPANT";
  const { setCurrentUser, setCurrentRole } = useAppStore();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (legacyParticipantLink) {
      const target = eventId
        ? `/events/register?eventId=${encodeURIComponent(eventId)}`
        : "/events/public";
      router.replace(target);
    }
  }, [eventId, legacyParticipantLink, router]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await authApi.register({
        name,
        email,
        password,
        role: "ORGANIZATION_ADMIN",
        organizationName,
      });
      setCurrentUser(result.user);
      setCurrentRole(result.user.role);
      router.push("/dashboard");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Organization registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (legacyParticipantLink) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100"><LoaderCircle className="mr-3 h-5 w-5 animate-spin text-indigo-300" /><p className="text-sm text-slate-300">Opening public event registration…</p></main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 flex items-center justify-center">
      <section className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
        <header className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-mono text-xl font-bold text-white shadow-lg shadow-indigo-500/30"><Building2 className="h-6 w-6" /></div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Create Organization Account</h1>
          <p className="text-sm leading-6 text-slate-400">Set up your organization workspace to create and manage events.</p>
        </header>

        <div className="flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs leading-5 text-indigo-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Participants do not create an account before registering. Open an event portal, submit the public registration form, and EVENTOPS creates the participant space and emails the login details.</p>
        </div>

        {errorMsg && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{errorMsg}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="Full name" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={255} />
          <Input label="Organization / institution name" required autoComplete="organization" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} minLength={2} maxLength={255} />
          <Input label="Admin email address" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Password (at least 8 characters)" type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} />
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} disabled={isLoading} rightIcon={<ArrowRight className="h-4 w-4" />}>
            {isLoading ? "Creating organization…" : "Create organization & continue"}
          </Button>
        </form>

        <div className="space-y-3 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
          <p>Looking to participate in an event? <Link href="/events/public" className="font-semibold text-indigo-400 hover:underline">Browse public events</Link> and register from the event portal.</p>
          <p>Already an administrator? <Link href="/login" className="font-semibold text-indigo-400 hover:underline">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
