"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { eventsApi } from "@/lib/api/events";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/types";
import { Building, Scale, HeartHandshake, ShieldCheck, Wrench, Package, Users, KeyRound } from "lucide-react";

type LoginRole = Exclude<UserRole, "SUPER_ADMIN" | "EVENT_ADMIN">;

const roleOptions: Array<{ role: LoginRole; label: string; description: string; home: string; icon: React.ComponentType<{className?:string}> }> = [
  { role: "ORGANIZATION_ADMIN", label: "Organization Admin", description: "Manage every event belonging to your verified organization.", home: "/dashboard", icon: Building },
  { role: "PARTICIPANT", label: "Participant", description: "Open your own team and participant tools.", home: "/participant", icon: Users },
  { role: "JUDGE", label: "Judge", description: "Use only event assignments approved for your account.", home: "/judge", icon: Scale },
  { role: "VOLUNTEER", label: "Volunteer", description: "Use your assigned field operations tools.", home: "/attendance/scanner", icon: HeartHandshake },
  { role: "COORDINATOR", label: "Coordinator", description: "Use the event operations tools assigned to you.", home: "/control-center", icon: ShieldCheck },
  { role: "TECHNICAL_STAFF", label: "Technical Staff", description: "Use your assigned technical operations tools.", home: "/technical-staff", icon: Wrench },
  { role: "RESOURCE_MANAGER", label: "Resource Manager", description: "Use your assigned inventory and distribution tools.", home: "/resource-manager", icon: Package },
];

type FailureKind = "unauthenticated" | "forbidden" | "not-found" | "unavailable" | "unknown";
function errorMessage(error: unknown): { kind: FailureKind; message: string } {
  const message = error instanceof Error ? error.message : "Unable to sign in.";
  const status = error && typeof error === "object" && "status" in error ? Number((error as {status?:unknown}).status) : undefined;
  if (status === 401 || /401|authentication failed|invalid email or password/i.test(message)) return {kind:"unauthenticated",message:"Credentials were not accepted. Check your email and password."};
  if (status === 403 || /403|forbidden|access denied|assignment is missing|no active event assignment|does not match/i.test(message)) return {kind:"forbidden",message:"Access was denied. For Organization Admin access, use an account with an active organization membership. Event roles must have an active assignment to this event."};
  if (status === 404 || /404|not found/i.test(message)) return {kind:"not-found",message:"The selected event could not be found."};
  if (/could not reach the API|network|failed to fetch|endpoint:/i.test(message)) return {kind:"unavailable",message:"The authentication service could not be reached. Check connectivity and the configured backend, then retry."};
  return {kind:"unknown",message};
}

export default function StaticEventLoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const eventId = (params.get("eventId") || "").trim();
  const queryRole = params.get("role");
  const queryEmail = params.get("email") || "";
  const { setCurrentUser, setCurrentRole, setCurrentEvent } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<LoginRole>("ORGANIZATION_ADMIN");
  const [eventName, setEventName] = useState("");
  const [eventLoading, setEventLoading] = useState(Boolean(eventId));
  const [email, setEmail] = useState(queryEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{kind:FailureKind;message:string}|null>(null);

  useEffect(() => {
    if (queryRole && roleOptions.some(option => option.role === queryRole)) setSelectedRole(queryRole as LoginRole);
    if (queryEmail) setEmail(queryEmail);
  }, [queryRole, queryEmail]);

  useEffect(() => {
    let active = true;
    async function loadEvent() {
      if (!eventId) { setEventLoading(false); return; }
      setEventLoading(true);
      try {
        const event = await eventsApi.getPublicById(eventId);
        if (active) {
          setEventName(event.name);
          setCurrentEvent(event);
        }
      } catch (error) {
        if (active) setFailure(errorMessage(error));
      } finally {
        if (active) setEventLoading(false);
      }
    }
    void loadEvent();
    return () => { active = false; };
  }, [eventId, setCurrentEvent]);

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setBusy(true);
    setFailure(null);
    try {
      let session;
      if (selectedRole === "ORGANIZATION_ADMIN") {
        // Organization administrators sign in through their organization membership,
        // not through an event-personnel assignment.
        session = await authApi.login(email, password, "ORGANIZATION_ADMIN");
      } else {
        if (!eventId) {
          setFailure({kind:"not-found",message:"The event login link is missing eventId. Open the login link from the selected event."});
          return;
        }
        session = await authApi.eventLogin(eventId, email, password, selectedRole);
      }
      setCurrentUser(session.user);
      setCurrentRole(selectedRole);
      if (selectedRole === "ORGANIZATION_ADMIN") {
        router.push("/dashboard");
      } else if (selectedRole === "PARTICIPANT") {
        router.push(`/participant?eventId=${encodeURIComponent(eventId)}`);
      } else {
        router.push(roleOptions.find(option => option.role === selectedRole)?.home || "/dashboard");
      }
    } catch (error) {
      setFailure(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const options = eventId ? roleOptions : roleOptions.filter(option => option.role === "ORGANIZATION_ADMIN");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
          <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Authentication</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{eventId ? eventName || (eventLoading ? "Loading event…" : "Event role login") : "Organization Admin login"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">The selected event identifies the context; it does not grant access. Organization Admin permission comes from your authenticated account and active organization membership. Event roles require an active assignment to this event.</p>
          {eventId && !eventLoading && eventName && <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-slate-400">Event ID: {eventId}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map(option => {
              const Icon = option.icon;
              const selected = selectedRole === option.role;
              return <button key={option.role} type="button" onClick={() => { setSelectedRole(option.role); setFailure(null); }} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${selected ? "text-indigo-300" : "text-slate-500"}`} /><span className="font-semibold text-white">{option.label}</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{option.description}</p>
              </button>;
            })}
          </div>
          {failure && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><KeyRound className="h-4 w-4 shrink-0" /><span>{failure.message}</span></div>}
          <div className="space-y-4">
            <label className="block text-xs font-mono text-slate-300">Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" /></label>
            <label className="block text-xs font-mono text-slate-300">Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" /></label>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy || eventLoading} isLoading={busy}>{busy ? "Signing in…" : "Sign in securely"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push(eventId ? `/events/portal?eventId=${encodeURIComponent(eventId)}` : "/events")}>Back</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
