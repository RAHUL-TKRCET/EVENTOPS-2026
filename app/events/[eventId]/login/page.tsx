"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { useAppStore } from "@/store";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { UserRole } from "@/types";
import {
  Calendar,
  Lock,
  Mail,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Wrench,
  Package,
  Building,
  Users,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Info,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

interface RoleOption {
  role: UserRole;
  label: string;
  badge: string;
  desc: string;
  scopeNotice: string;
  icon: any;
  borderActive: string;
  badgeColor: string;
  homePath: string;
}

const roleOptions: RoleOption[] = [
  {
    role: "VOLUNTEER",
    label: "Volunteer",
    badge: "Field Ops & Scanners",
    desc: "Turnstile attendee QR verification, floor support & runner tasks",
    scopeNotice: "Restricted to QR scanner and assigned floor shifts. Administrative and scoring datasets are locked.",
    icon: HeartHandshake,
    borderActive: "border-teal-500 bg-teal-500/10 text-teal-400",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    homePath: "/volunteers",
  },
  {
    role: "JUDGE",
    label: "Judge / Evaluator",
    badge: "Jury Panel",
    desc: "Assigned project assessments, real-time rubric scoring & jury verdicts",
    scopeNotice: "Restricted to assigned teams and evaluation criteria. Event administration is locked.",
    icon: Scale,
    borderActive: "border-amber-500 bg-amber-500/10 text-amber-400",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    homePath: "/judge",
  },
  {
    role: "COORDINATOR",
    label: "Coordinator",
    badge: "Floor Command",
    desc: "Stage tracking, queue management & live incident resolution",
    scopeNotice: "Floor management access enabled. Organization tenant management locked.",
    icon: ShieldCheck,
    borderActive: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    homePath: "/control-center",
  },
  {
    role: "TECHNICAL_STAFF",
    label: "Technical Staff",
    badge: "Infra & Power",
    desc: "Networking, AV setups, power grid distribution & lab readiness",
    scopeNotice: "Restricted to infrastructure, rooms, and technical tickets.",
    icon: Wrench,
    borderActive: "border-orange-500 bg-orange-500/10 text-orange-400",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    homePath: "/technical-staff",
  },
  {
    role: "RESOURCE_MANAGER",
    label: "Resource Manager",
    badge: "Kits & Meals",
    desc: "Meal tokens, swag distribution, ID badges & hardware kits",
    scopeNotice: "Restricted to inventory, catering, and supply distribution terminals.",
    icon: Package,
    borderActive: "border-rose-500 bg-rose-500/10 text-rose-400",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    homePath: "/resource-manager",
  },
  {
    role: "PARTICIPANT",
    label: "Participant",
    badge: "Hacker / Attendee",
    desc: "Team pass, project submission, schedule & live notifications",
    scopeNotice: "Restricted to personal team details, venue allocation, and live leaderboard.",
    icon: Users,
    borderActive: "border-pink-500 bg-pink-500/10 text-pink-400",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    homePath: "/participant",
  },
  {
    role: "ORGANIZATION_ADMIN",
    label: "Org Admin",
    badge: "Tenant Oversight",
    desc: "Institution dean, corporate partner & department lead oversight",
    scopeNotice: "Full institution-level visibility across all organization events.",
    icon: Building,
    borderActive: "border-indigo-500 bg-indigo-500/10 text-indigo-400",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    homePath: "/dashboard",
  },
];

export default function DedicatedEventLoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;

  const { setCurrentUser, setCurrentRole, setCurrentEvent } = useAppStore();

  const [event, setEvent] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("VOLUNTEER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch event from backend or mock fallback
    fetch(`http://localhost:5000/api/v1/events/${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setEvent(data);
        else {
          const fallback = mockEvents.find((e) => e.id === eventId) || mockEvents[0];
          setEvent(fallback);
        }
      })
      .catch(() => {
        const fallback = mockEvents.find((e) => e.id === eventId) || mockEvents[0];
        setEvent(fallback);
      });

    // 2. Parse query parameters if visiting via invite link (?email=...&role=...)
    const qRole = searchParams.get("role") as UserRole;
    const qEmail = searchParams.get("email");

    if (qRole && roleOptions.some((r) => r.role === qRole)) {
      setSelectedRole(qRole);
    }
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [eventId, searchParams]);

  const activeOption = roleOptions.find((r) => r.role === selectedRole) || roleOptions[0];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Verify credentials and enrollment via backend event-login
      const res = await fetch("http://localhost:5000/api/v1/auth/event-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setCurrentUser(json.user);
        setCurrentRole(selectedRole);
        if (event) setCurrentEvent(event);

        if (typeof window !== "undefined") {
          localStorage.setItem("eventops_token", json.accessToken);
        }

        router.push(activeOption.homePath);
        return;
      }

      const errJson = await res.json().catch(() => ({}));
      if (errJson.message) {
        throw new Error(errJson.message);
      }

      // 2. Fallback via local authApi
      const localRes = await authApi.login(email, password, selectedRole);
      setCurrentUser(localRes.user);
      setCurrentRole(selectedRole);
      if (event) setCurrentEvent(event);
      router.push(activeOption.homePath);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate for this event. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Event Header Banner */}
        <div className="p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {event?.id || eventId}
              </span>
              <StatusBadge status={event?.status || "LIVE"} />
              <span className="text-xs text-slate-400 font-mono">
                {event?.type || "Hackathon"}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-mono text-white">
              {event?.name || "EventOps 2026"}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Role-specific secure authentication terminal. Select your designated role below to enter your operational workspace.
            </p>
          </div>

          <button
            onClick={() => router.push(`/events/${eventId}/portal`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-slate-300 hover:text-white transition shrink-0"
          >
            <span>View Event Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Role Selector Grid */}
        <div className="space-y-3">
          <label className="text-xs font-semibold font-mono text-slate-300 uppercase tracking-wider block">
            1. Select Your Event Role Terminal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(opt.role);
                    setErrorMessage(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                    isSelected
                      ? `${opt.borderActive} shadow-lg ring-1 ring-white/10`
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5" />
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold font-mono block leading-tight">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{opt.badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Box */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activeOption.badgeColor}`}>
                <activeOption.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-mono text-white">
                    {activeOption.label} Terminal Login
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${activeOption.badgeColor}`}>
                    {selectedRole}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {activeOption.desc}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              Scoped Event: <span className="text-indigo-400 font-bold">{eventId}</span>
            </div>
          </div>

          {/* Scoped RBAC Notice Banner */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-3 text-xs text-slate-300">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Role Isolation Policy:</strong> {activeOption.scopeNotice}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1.5">
                Official / Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  Terminal Password
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Default: <code className="text-indigo-400">EventOps@2026</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In as {activeOption.label}
            </Button>
          </form>

          {/* Quick Demo Pre-fills for Testing */}
          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2">
              Quick Test Autofill for this Event:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("VOLUNTEER");
                  setEmail("volunteer@vistera.org");
                  setPassword("EventOps@2026");
                }}
                className="px-2.5 py-1 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 font-mono"
              >
                Volunteer Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("JUDGE");
                  setEmail("judge@vistera.org");
                  setPassword("EventOps@2026");
                }}
                className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-mono"
              >
                Judge Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("TECHNICAL_STAFF");
                  setEmail("tech@vistera.org");
                  setPassword("EventOps@2026");
                }}
                className="px-2.5 py-1 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 font-mono"
              >
                Tech Staff Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("RESOURCE_MANAGER");
                  setEmail("resources@vistera.org");
                  setPassword("EventOps@2026");
                }}
                className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-mono"
              >
                Resource Mgr Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("PARTICIPANT");
                  setEmail("participant@vistera.org");
                  setPassword("EventOps@2026");
                }}
                className="px-2.5 py-1 rounded-lg border border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 font-mono"
              >
                Participant Demo
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2">
          <button
            onClick={() => router.push(`/events/${eventId}/portal`)}
            className="hover:text-white transition flex items-center gap-1.5"
          >
            ← Back to Public Event Details & Portal
          </button>
          <button
            onClick={() => router.push("/")}
            className="hover:text-white transition flex items-center gap-1.5 text-indigo-400"
          >
            Event Admin Authentication Portal →
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 font-mono mt-10">
        EVENTOPS 2026 • Scoped Role-Based Access Control Architecture
      </div>
    </div>
  );
}

