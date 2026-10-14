"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { eventsApi } from "@/lib/api/events";
import { useAppStore } from "@/store";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/Button";
import { Building, HeartHandshake, Package, Scale, ShieldCheck, Wrench, KeyRound, AlertTriangle } from "lucide-react";

type EventRole = Exclude<UserRole, "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "PARTICIPANT">;

const roleOptions: Array<{ role: EventRole; label: string; description: string; home: string; icon: React.ComponentType<{ className?: string }> }> = [
  { role: "EVENT_ADMIN", label: "Event Admin", description: "Operate and administer this specific event.", home: "/dashboard", icon: Building },
  { role: "COORDINATOR", label: "Coordinator", description: "Manage the event floor, attendance, and operational issues.", home: "/control-center", icon: ShieldCheck },
  { role: "JUDGE", label: "Judge", description: "Review assigned teams and submit evaluation scores.", home: "/judge", icon: Scale },
  { role: "VOLUNTEER", label: "Volunteer", description: "Use assigned field operations and attendance tools.", home: "/attendance/scanner", icon: HeartHandshake },
  { role: "TECHNICAL_STAFF", label: "Technical Staff", description: "Handle assigned technical, room, and network operations.", home: "/technical-staff", icon: Wrench },
  { role: "RESOURCE_MANAGER", label: "Resource Manager", description: "Manage event inventory, supplies, and distributions.", home: "/resource-manager", icon: Package },
];

type FailureKind = "unauthenticated" | "forbidden" | "not-found" | "unavailable" | "unknown";
function classify(error: unknown): { kind: FailureKind; message: string } {
  const message = error instanceof Error ? error.message : "Unable to sign in.";
  const status = error && typeof error === "object" && "status" in error ? Number((error as { status?: unknown }).status) : undefined;
  if (status === 401 || /401|authentication failed|invalid email or password/i.test(message)) return { kind: "unauthenticated", message: "Credentials were not accepted. Check your event-role email and password." };
  if (status === 403 || /403|forbidden|access denied|assignment is missing|not enrolled|does not match/i.test(message)) return { kind: "forbidden", message: "Access denied. Your account must have an active assignment to this event for the selected role." };
  if (status === 404 || /404|not found/i.test(message)) return { kind: "not-found", message: "The selected event could not be found." };
  if (/could not reach the API|network|failed to fetch|endpoint:/i.test(message)) return { kind: "unavailable", message: "The event authentication service could not be reached. Try again." };
  return { kind: "unknown", message };
}

export default function StaticEventLoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const eventId = (params.get("eventId") || "").trim();
  const { setCurrentUser, setCurrentRole, setCurrentEvent } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<EventRole>("EVENT_ADMIN");
  const [eventName, setEventName] = useState("");
  const [eventLoading, setEventLoading] = useState(Boolean(eventId));
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ kind: FailureKind; message: string } | null>(null);

  useEffect(() => {
    const queryRole = params.get("role");
    if (queryRole && roleOptions.some((option) => option.role === queryRole)) setSelectedRole(queryRole as EventRole);
    const queryEmail = params.get("email");
    if (queryEmail) setEmail(queryEmail);
  }, [params]);

  useEffect(() => {
    let active = true;
    if (!eventId) {
      setEventLoading(false);
      setFailure({ kind: "not-found", message: "This event login link is missing eventId. Open the login link supplied by the event organizer." });
      return () => { active = false; };
    }
    eventsApi.getPublicById(eventId).then((event) => {
      if (!active) return;
      setEventName(event.name);
      setCurrentEvent(event);
    }).catch((error) => {
      if (active) setFailure(classify(error));
    }).finally(() => {
      if (active) setEventLoading(false);
    });
    return () => { active = false; };
  }, [eventId, setCurrentEvent]);

  const submit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!eventId) return;
    setBusy(true);
    setFailure(null);
    try {
      const session = await authApi.eventLogin(eventId, email, password, selectedRole);
      setCurrentUser(session.user);
      setCurrentRole(session.user.role);
      router.push(`${roleOptions.find((option) => option.role === selectedRole)?.home || "/dashboard"}?eventId=${encodeURIComponent(eventId)}`);
    } catch (error) {
      setFailure(classify(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
          <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Event role login</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{eventName || (eventLoading ? "Loading event…" : "Event role login")}</h1>
          {eventId && eventName && <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-slate-400">Event ID: {eventId}</p>}
          <p className="mt-3 text-sm leading-6 text-slate-400">This login is only for personnel assigned to this event. Organization Admin and Super Admin accounts use the normal admin login. Participants register through the public event registration page.</p>
        </header>

        <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const active = selectedRole === option.role;
              return <button key={option.role} type="button" onClick={() => { setSelectedRole(option.role); setFailure(null); }} className={`rounded-2xl border p-4 text-left transition ${active ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${active ? "text-indigo-300" : "text-slate-500"}`} /><span className="font-semibold text-white">{option.label}</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{option.description}</p>
              </button>;
            })}
          </div>

          {failure && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertTriangle className="h-4 w-4 shrink-0" /><span>{failure.message}</span></div>}

          <div className="space-y-4">
            <label className="block text-xs font-mono text-slate-300">Event-role email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" /></label>
            <label className="block text-xs font-mono text-slate-300">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" /></label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy || eventLoading || !eventId} isLoading={busy} rightIcon={<KeyRound className="h-4 w-4"}>{busy ? "Signing in…" : `Sign in as ${roleOptions.find((option) => option.role === selectedRole)?.label}`}</Button>
            <Button type="button" variant="outline" onClick={() => router.push(eventId ? `/events/portal?eventId=${encodeURIComponent(eventId)}` : "/")}>Back to event portal</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
