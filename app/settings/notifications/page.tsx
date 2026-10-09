"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Bell, Check } from "lucide-react";
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

export default function NotificationSettingsPage() {
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">System & Workspace Settings</h2>
        <p className="text-xs text-slate-400">Configure real-time event alerts and push notification rules.</p>
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
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <span>Operational Event Dispatch Triggers</span>
        </h3>

        <div className="space-y-3">
          {[
            { title: "Critical Incidents (Power / Network Trip)", desc: "Immediate SMS & Push to Technical Staff on duty", def: true },
            { title: "Judge Overload Warning (Fatigue > 85%)", desc: "Notification sent to Operations Director to trigger solver re-balancing", def: true },
            { title: "Unallocated Teams Alert", desc: "Alert when teams check-in without pre-computed bench", def: true },
            { title: "Low Stock Logistics Depletion", desc: "Alert when food or hardware falls under threshold", def: false },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200">{item.title}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked={item.def} className="rounded accent-indigo-600 w-4 h-4" />
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end border-t border-slate-800">
          <Button
            size="md"
            variant="primary"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? "Saved ✓" : "Save Notification Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
