"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ShieldCheck,
  Calendar,
  Users,
  Cpu,
  QrCode,
  ArrowRight,
  Lock,
  Sparkles,
  Building2,
  CheckCircle2,
  Radio,
  Layers,
  Search,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, setCurrentRole } = useAppStore();

  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (authMode === "LOGIN") {
        const res = await authApi.login(email, password, "EVENT_ADMIN");
        setCurrentUser(res.user);
        setCurrentRole("EVENT_ADMIN");
        router.push("/dashboard");
      } else {
        const res = await authApi.register({
          name,
          email,
          password,
          role: "EVENT_ADMIN",
        });
        setCurrentUser(res.user);
        setCurrentRole("EVENT_ADMIN");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJumpToEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCode.trim()) return;
    router.push(`/events/${eventCode.trim()}/portal`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-mono font-bold text-white text-lg shadow-lg shadow-indigo-600/30">
              EO
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-base text-white font-mono block">
                EVENTOPS
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight block">
                MISSION CONTROL FOR HIGH-STAKES EVENTS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/dashboard")}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Dashboard ({currentUser.role})
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuthMode("LOGIN");
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                >
                  Admin Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setAuthMode("REGISTER");
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                >
                  Create Admin Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal Event Operations & RBAC Architecture</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-white leading-tight">
              Run the event, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400">
                not the paperwork.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Launch hackathons, tech summits, and university fests. Delegate roles to Volunteers, Judges, and Coordinators, generate dedicated event login portals, and control live telemetry.
            </p>
          </div>

          {/* Main Action Section: Event Admin Auth Card vs Already Logged In */}
          <div className="max-w-md mx-auto">
            {currentUser && currentUser.role === "EVENT_ADMIN" ? (
              <div className="p-8 rounded-3xl border border-indigo-500/40 bg-slate-900/90 shadow-2xl backdrop-blur-md text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">Active Event Admin Session</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Logged in as <span className="text-indigo-300 font-semibold">{currentUser.name}</span> ({currentUser.email})
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => router.push("/dashboard")}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Enter Operations Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md space-y-6">
                {/* Tabs */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("LOGIN");
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition ${
                      authMode === "LOGIN"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Event Admin Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("REGISTER");
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition ${
                      authMode === "REGISTER"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Create Main Account
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white font-mono">
                    {authMode === "LOGIN" ? "Event Director Authentication" : "Register Event Admin Account"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {authMode === "LOGIN"
                      ? "Sign into your verified Event Admin workspace to operate your events."
                      : "Create your primary administrative identity to launch events and add staff."}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleAdminAuth} className="space-y-4">
                  {authMode === "REGISTER" && (
                    <Input
                      label="Full Legal / Director Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rachel Dupont"
                    />
                  )}

                  <Input
                    label="Official / Academic Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@organization.com"
                  />

                  <Input
                    label="Account Password"
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
                    {authMode === "LOGIN" ? "Sign In as Event Admin" : "Create Main Event Admin Account"}
                  </Button>
                </form>

                <div className="text-center text-[11px] text-slate-500 font-mono">
                  Strict Enterprise RBAC • Persistent PostgreSQL 16 Storage
                </div>
              </div>
            )}
          </div>

          {/* Jump to Specific Event Portal */}
          <div className="max-w-xl mx-auto p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-bold text-slate-200 font-mono">Already have an Event Link or Code?</span>
              <p className="text-[11px] text-slate-400">
                Jump directly to the event-specific details and role login terminal.
              </p>
            </div>

            <form onSubmit={handleJumpToEvent} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="e.g. evt-01"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                className="w-full sm:w-32 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
              <Button size="sm" variant="outline" type="submit" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Core Architecture Capabilities */}
      <section className="border-t border-slate-800/80 bg-slate-950/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
              End-to-End Operational Lifecycle
            </h2>
            <p className="text-xs text-slate-400">
              Complete separation of administrative oversight from role-scoped interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Delegated Staffing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add Volunteers, Judges, Coordinators, Technical Staff, and Resource Managers directly with personalized event links.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Dedicated Event Portals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every created event generates a dedicated public page with event details, stage rules, and role-specific login terminals.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Cryptographic QR Passes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                HMAC-SHA256 verified tokens for contactless turnstile check-ins, lunch tokens, and workstation assignments.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">CP-SAT Allocator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated constraint optimization engine solving venue seating, power constraints, and jury assignment matrices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 font-mono">
        EVENTOPS 2026 • Team Panch Pandavs • PostgreSQL 16 Architecture Active
      </footer>
    </div>
  );
}
