"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store";
import { User, Check } from "lucide-react";
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

export default function ProfileSettingsPage() {
  const pathname = usePathname();
  const { currentUser, setCurrentUser } = useAppStore();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || "+1 415-555-0199");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({ ...currentUser, name, email, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">System & Workspace Settings</h2>
        <p className="text-xs text-slate-400">Manage individual credentials and avatar identity.</p>
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

      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-lg text-indigo-300">
            {name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{name}</h3>
            <p className="text-xs text-slate-400 font-mono">Role: {currentUser.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Mobile Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" /> Profile updated successfully
            </span>
          )}
          <Button type="submit" variant="primary" size="md" className="ml-auto">
            Update Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
