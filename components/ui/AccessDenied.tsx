"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { UserRole } from "@/types";
import { getRoleHomeRoute, ROLE_CONFIGS } from "@/lib/permissions";
import { ShieldAlert, ArrowLeft, ArrowRight, Lock, UserCheck } from "lucide-react";
import { Button } from "./Button";

export interface AccessDeniedProps {
  attemptedPath: string;
  allowedRoles?: UserRole[];
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ attemptedPath, allowedRoles }) => {
  const router = useRouter();
  const { currentRole, setCurrentRole } = useAppStore();
  const roleConfig = ROLE_CONFIGS[currentRole];
  const homeRoute = getRoleHomeRoute(currentRole);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl p-8 rounded-3xl border border-rose-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Lock className="w-3.5 h-3.5" />
            <span>403 FORBIDDEN — RBAC GUARD ACTIVE</span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-white">Access Restricted</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Your current role <span className="font-semibold text-rose-300 font-mono">[{roleConfig?.label || currentRole}]</span> does not possess clearance for the route:
          </p>
          <div className="font-mono text-xs text-indigo-400 bg-slate-950 p-2 rounded-lg border border-slate-800 inline-block">
            {attemptedPath}
          </div>
        </div>

        {allowedRoles && allowedRoles.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Required Clearance Level:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allowedRoles.map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-200 border border-slate-700"
                >
                  {ROLE_CONFIGS[r]?.label || r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => router.push(homeRoute)}
          >
            Go to {roleConfig?.label} Portal
          </Button>
        </div>

        {/* Security & Authentication Notice */}
        <div className="pt-5 border-t border-slate-800 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Need higher clearance? Sign in with an authorized credentials account.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/login")}
          >
            Authenticate via Role Login →
          </Button>
        </div>
      </div>
    </div>
  );
};
