"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store";
import { profileApi } from "@/lib/api/profile";
import { AlertCircle, Check, LoaderCircle, User } from "lucide-react";
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
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(currentUser?.name || "");
    setEmail(currentUser?.email || "");
    setPhone(currentUser?.phone || "");
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be signed in to update your profile.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const updated = await profileApi.update({ name, email, phone });
      setCurrentUser(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">System & Workspace Settings</h2>
        <p className="text-xs text-slate-400">Manage your persisted profile information. Role and organization membership remain server-controlled.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        {settingsNav.map((item) => (
          <Link key={item.href} href={item.href} className={`px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap ${pathname === item.href ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}>
            {item.label}
          </Link>
        ))}
      </div>

      {!currentUser && <div role="alert" className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"><User className="h-5 w-5 shrink-0" /><p>Sign in before editing profile information.</p></div>}
      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}

      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-lg text-indigo-300">
            {(name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{name || "User"}</h3>
            <p className="text-xs text-slate-400 font-mono">Role: {currentUser?.role || "USER"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} disabled={saving || !currentUser} />
          <Input label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={saving || !currentUser} />
          <Input label="Mobile Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={saving || !currentUser} />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          {saved && <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium"><Check className="w-4 h-4" /> Profile updated successfully</span>}
          <Button type="submit" variant="primary" size="md" className="ml-auto" disabled={saving || !currentUser}>
            {saving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Update Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
