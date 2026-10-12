"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { authApi } from "@/lib/api/auth";
import { eventsApi } from "@/lib/api/events";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { UserRole } from "@/types";
import {
  Calendar,
  Clock,
  Building,
  Users,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Wrench,
  Package,
  Layers,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";

const eventRoles: { role: UserRole; label: string; desc: string; icon: any; color: string }[] = [
  { role: "PARTICIPANT", label: "Participant", desc: "Hacker & Project Team Lead", icon: Users, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
  { role: "JUDGE", label: "Judge / Evaluator", desc: "Jury Panel & Scorecard Terminal", icon: Scale, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { role: "VOLUNTEER", label: "Volunteer", desc: "Turnstile Check-In & Field Ops", icon: HeartHandshake, color: "text-teal-400 border-teal-500/30 bg-teal-500/10" },
  { role: "COORDINATOR", label: "Coordinator", desc: "Stage & Floor Operations Lead", icon: ShieldCheck, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { role: "TECHNICAL_STAFF", label: "Technical Staff", desc: "Network, Power & AV Facilities", icon: Wrench, color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  { role: "RESOURCE_MANAGER", label: "Resource Manager", desc: "Swag Kits, Badges & Meals", icon: Package, color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  { role: "ORGANIZATION_ADMIN", label: "Org Admin", desc: "Institution & Campus Executive", icon: Building, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
];

export default function EventPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = (searchParams.get("eventId") || "").trim();

  const { setCurrentUser, setCurrentRole, setCurrentEvent } = useAppStore();

  const [event, setEvent] = useState<any>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>("PARTICIPANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadEvent() {
      setEventLoading(true);
      try {
        const result = await eventsApi.getPublicById(eventId);
        if (active) setEvent(result);
      } catch (error) {
        if (active) setErrorMsg(error instanceof Error ? error.message : "Unable to load this event.");
      } finally {
        if (active) setEventLoading(false);
      }
    }
    if (eventId) void loadEvent();
    else {
      setErrorMsg("This event link is missing its eventId query parameter. Use an updated link from the organizer.");
      setEventLoading(false);
    }
    const qRole = searchParams.get("role") as UserRole;
    const qEmail = searchParams.get("email");
    if (qRole && eventRoles.some((r) => r.role === qRole)) setSelectedRole(qRole);
    if (qEmail) setEmail(qEmail);
    return () => { active = false; };
  }, [eventId, searchParams]);

  const handleCopyPortalLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleEventRoleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (selectedRole === "ORGANIZATION_ADMIN") {
        // Org administrators are authenticated by their organization membership,
        // not by requiring an event-personnel membership row for every event.
        const session = await authApi.login(email, password, "ORGANIZATION_ADMIN");
        setCurrentUser(session.user);
        setCurrentRole("ORGANIZATION_ADMIN");
        if (event) setCurrentEvent(event);
        router.push("/dashboard");
        return;
      }

      // Event roles must prove an active assignment to this specific event.
      const session = await authApi.eventLogin(eventId, email, password, selectedRole);
      setCurrentUser(session.user);
      setCurrentRole(selectedRole);
      if (event) setCurrentEvent(event);
      routeToRolePortal(selectedRole);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to authenticate for this event.");
    } finally {
      setIsLoading(false);
    }
  };

  const routeToRolePortal = (role: UserRole) => {
    switch (role) {
      case "PARTICIPANT":
        router.push("/participant");
        break;
      case "JUDGE":
        router.push("/judge");
        break;
      case "VOLUNTEER":
        router.push("/attendance/scanner");
        break;
      case "TECHNICAL_STAFF":
        router.push("/technical-staff");
        break;
      case "RESOURCE_MANAGER":
        router.push("/resource-manager");
        break;
      case "COORDINATOR":
        router.push("/control-center");
        break;
      case "ORGANIZATION_ADMIN":
        router.push("/dashboard");
        break;
      default:
        router.push("/dashboard");
        break;
    }
  };

  if (eventLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4"><p className="text-slate-400 font-mono text-xs">Loading event details…</p></div>;
  }
  if (!event) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4"><div className="max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h1 className="text-lg font-bold">Event details unavailable</h1><p role="alert" className="text-sm text-slate-300">{errorMsg || "This event could not be loaded."}</p><Button variant="outline" onClick={() => router.push("/events")}>Back to Events</Button></div></div>;
  }

  const activeRoleMeta = eventRoles.find((r) => r.role === selectedRole) || eventRoles[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-mono font-bold text-white text-lg shadow-lg shadow-indigo-600/30">
              EO
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-base text-white font-mono block">
                {event.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight block">
                EVENT ID: {event.id} • DEDICATED ROLES ACCESS TERMINAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPortalLink}
              leftIcon={copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedLink ? "Link Copied!" : "Share Event Link"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Event Showcase Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{event.id}</span>
                <StatusBadge status={event.status || "LIVE"} />
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  {event.type}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                {event.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                {event.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 text-right space-y-1 shrink-0">
              <span className="text-[10px] uppercase font-mono text-slate-400">Current Phase</span>
              <p className="text-sm font-mono font-bold text-indigo-400">
                Round {event.currentRound || 1} of {event.totalRounds || 3}
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                Capacity: {event.expectedParticipants || 120} Attendees
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block">LOCATION / VENUE</span>
              <span className="text-slate-200 font-medium">{event.location || "Campus Hall 1-4"}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">START TIME</span>
              <span className="text-slate-200 font-medium">
                {new Date(event.startDate || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">END TIME</span>
              <span className="text-slate-200 font-medium">
                {new Date(event.endDate || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">REGISTRATION DEADLINE</span>
              <span className="text-slate-200 font-medium">
                {new Date(event.registrationDeadline || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Role Login Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Role Selector Tabs */}
          <div className="lg:col-span-5 space-y-3">
            <div>
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Select Your Assigned Event Role
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each enrolled role possesses designated clearance and scoped tools for this event.
              </p>
            </div>

            <div className="space-y-2">
              {eventRoles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.role);
                      setErrorMsg(null);
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${r.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="truncate flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">{r.label}</span>
                        {isSelected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Scoped Role Authentication Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${activeRoleMeta.color}`}
                  >
                    {React.createElement(activeRoleMeta.icon, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">
                      {activeRoleMeta.label} Portal Login
                    </h3>
                    <p className="text-xs text-slate-400">
                      Scoped authentication for <span className="text-slate-200 font-semibold">{event.name}</span>
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[10px] font-mono text-slate-500 block">ACCESS CLEARANCE</span>
                  <span className="text-xs font-mono font-bold text-sky-400 uppercase">
                    {activeRoleMeta.role}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              <form onSubmit={handleEventRoleLogin} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. member@eventops.demo"
                />

                <Input
                  label="Security Password / Passcode"
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
                  Sign In as {activeRoleMeta.label}
                </Button>
              </form>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
                <span>Enterprise RBAC Scoped to {event.id}</span>
                <span>Event access is verified by the backend.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

