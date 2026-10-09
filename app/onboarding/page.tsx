"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Calendar, Users, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OnboardingLandingPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-2xl p-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-mono font-bold text-xl shadow-lg shadow-indigo-500/30">
          EO
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          Welcome to EVENTOPS
        </h1>
        <p className="text-xs uppercase tracking-widest text-indigo-400 font-mono">
          Run the event, not the paperwork.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Choose your workspace setup to initialize your role-based event operations environment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Path 1: Organization Onboarding */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/50 hover:bg-slate-950/90 transition flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create Organization</h3>
              <p className="text-xs text-slate-400 mt-1">
                For universities, enterprises, event agencies, or non-profit communities hosting recurring events.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            className="w-full"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => router.push("/onboarding/organization")}
          >
            Setup Org
          </Button>
        </div>

        {/* Path 2: Single Personal Event */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-sky-500/50 hover:bg-slate-950/90 transition flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Personal Event</h3>
              <p className="text-xs text-slate-400 mt-1">
                Launch a standalone hackathon, tech summit, or competition with lightweight standalone ops.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => router.push("/onboarding/personal-event")}
          >
            Launch Event
          </Button>
        </div>

        {/* Path 3: Join Organization with Code */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-950/90 transition flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Join Existing Org</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your invitation code to access your team, floor management, or assigned jury panel.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => router.push("/onboarding/join-organization")}
          >
            Enter Code
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <Link href="/login" className="hover:text-white transition">
          ← Back to Sign In
        </Link>
        <span className="font-mono text-[11px] text-slate-500">
          EVENTOPS • Universal Multi-tenant Operations
        </span>
      </div>
    </div>
  );
}
