"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Server, Database, MessageSquare, Bot, Check, ArrowRight } from "lucide-react";
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

export default function IntegrationsSettingsPage() {
  const pathname = usePathname();

  const integrations = [
    { name: "Python / FastAPI Gateway", desc: "Native REST connector for future real backend deployment", status: "Ready for Connection", icon: <Server className="w-5 h-5 text-indigo-400" /> },
    { name: "PostgreSQL Database Engine", desc: "Relational persistence schema mapping for 120 teams", status: "Schema Verified", icon: <Database className="w-5 h-5 text-sky-400" /> },
    { name: "Google OR-Tools CP-SAT Solver", desc: "High-performance constraint programming solver microservice", status: "Active (Local Simulator)", icon: <Bot className="w-5 h-5 text-emerald-400" /> },
    { name: "WhatsApp Business Cloud API", desc: "Direct participant table & bench lookup webhook", status: "Webhook Ready", icon: <MessageSquare className="w-5 h-5 text-teal-400" /> },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">System & Workspace Settings</h2>
        <p className="text-xs text-slate-400">
          Architecture abstraction ready for FastAPI, PostgreSQL, OR-Tools, and WebSocket gateways.
        </p>
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

      <div className="space-y-3">
        {integrations.map((item, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{item.name}</h3>
                <p className="text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
