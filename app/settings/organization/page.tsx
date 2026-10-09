"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAppStore } from "@/store";
import { Building2, Check, Shield } from "lucide-react";
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

export default function OrganizationSettingsPage() {
  const pathname = usePathname();
  const { currentOrganization } = useAppStore();

  const [name, setName] = useState(currentOrganization?.name || "VISTRA Global Tech & Innovations");
  const [website, setWebsite] = useState(currentOrganization?.website || "https://vistratech.io");
  const [city, setCity] = useState(currentOrganization?.city || "San Francisco");
  const [country, setCountry] = useState(currentOrganization?.country || "United States");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">System & Workspace Settings</h2>
        <p className="text-xs text-slate-400">
          Manage tenant identity, fine-grained RBAC matrix, and webhook integrations.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
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

      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Tenant Identity & Domain</h3>
            <p className="text-xs text-slate-400">Configure public organization profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Organization Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Primary Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <Input label="City Headquarters" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" /> Organization settings saved
            </span>
          )}
          <Button type="submit" variant="primary" size="md" className="ml-auto">
            Save Workspace Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
