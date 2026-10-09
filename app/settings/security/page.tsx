"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock, Key } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsNav = [
  { label: "Organization", href: "/settings/organization" },
  { label: "User Profile", href: "/settings/profile" },
  { label: "Roles & Permissions", href: "/settings/roles" },
  { label: "Notification Channels", href: "/settings/notifications" },
  { label: "Security & MFA", href: "/settings/security" },
  { label: "API & Integrations", href: "/settings/integrations" },
];

export default function SecuritySettingsPage() {
  const pathname = usePathname();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">System & Workspace Settings</h2>
        <p className="text-xs text-slate-400">Security tokens, MFA policies, and cryptographic session protection.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        {settingsNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              pathname === item.href
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 text-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Enterprise MFA & Session Security</span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200">Two-Factor Authentication (TOTP)</span>
              <p className="text-[11px] text-slate-400">Enforce Google Authenticator / 1Password for all organizers</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active (Enforced)
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200">JWT Token Expiry Window</span>
              <p className="text-[11px] text-slate-400">Access tokens auto-rotated every 15 minutes</p>
            </div>
            <span className="font-mono text-slate-300">900 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
