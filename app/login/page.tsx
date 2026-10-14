"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi, ROLE_DEFAULT_USERS, ROLE_PASSWORDS } from "@/lib/api/auth";
import { useAppStore } from "@/store";
import { getRoleHomeRoute } from "@/lib/permissions";
import { ArrowRight, Building2, Crown, Eye, EyeOff, KeyRound, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { UserRole } from "@/types";

const ADMIN_ROLES: Array<{ role: "SUPER_ADMIN" | "ORGANIZATION_ADMIN"; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { role: "ORGANIZATION_ADMIN", label: "Organization Admin", description: "Create and manage events for your verified organization.", icon: Building2 },
  { role: "SUPER_ADMIN", label: "Super Admin", description: "Platform-wide administration and governance.", icon: Crown },
];

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, setCurrentRole } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<"SUPER_ADMIN" | "ORGANIZATION_ADMIN">("ORGANIZATION_ADMIN");
  const [email, setEmail] = useState(ROLE_DEFAULT_USERS.ORGANIZATION_ADMIN.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);

  const selected = ADMIN_ROLES.find((item) => item.role === selectedRole)!;
  const defaultPassword = ROLE_PASSWORDS[selectedRole];

  const selectRole = (role: "SUPER_ADMIN" | "ORGANIZATION_ADMIN") => {
    setSelectedRole(role);
    setEmail(ROLE_DEFAULT_USERS[role].email);
    setPassword("");
    setError("");
    setAuthSuccess(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setAuthSuccess(false);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password, selectedRole as UserRole);
      setCurrentUser(result.user);
      setCurrentRole(result.user.role);
      setAuthSuccess(true);
      window.setTimeout(() => router.push(getRoleHomeRoute(result.user.role)), 300);
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Access denied.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
        <header className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 font-mono font-bold text-white">EO</div>
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">EVENTOPS · Admin Login</h1>
              <p className="text-xs text-slate-400">Normal login is reserved for platform and organization administrators.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Event-specific staff must use the login link supplied for their event. Participants use the public event registration flow.
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {ADMIN_ROLES.map((item) => {
            const Icon = item.icon;
            const active = item.role === selectedRole;
            return (
              <button key={item.role} type="button" onClick={() => selectRole(item.role)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${active ? "text-indigo-300" : "text-slate-500"}`} /><span className="font-semibold text-white">{item.label}</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.description}</p>
              </button>
            );
          })}
        </section>

        {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
        {authSuccess && <div role="status" className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />Identity verified. Opening admin workspace…</div>}

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div><h2 className="font-semibold text-white">Sign in as {selected.label}</h2><p className="mt-1 text-xs text-slate-400">This page does not authenticate event-scoped operational roles.</p></div>
          <Input label="Admin email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <div>
            <Input label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} rightIcon={<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
            <div className="mt-2 flex justify-between text-[11px]">
              <button type="button" onClick={() => setPassword(defaultPassword)} className="flex items-center gap-1 text-indigo-400"><KeyRound className="h-3 w-3" />Use default demo passcode</button>
              <Link href="/forgot-password" className="text-slate-500 hover:text-slate-300">Forgot?</Link>
            </div>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} disabled={authSuccess} rightIcon={<ArrowRight className="h-4 w-4" />}>
            {authSuccess ? "Access Granted ✓" : `Authenticate as ${selected.label}`}
          </Button>
        </form>

        <footer className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
          Need a new organization? <Link href="/register" className="font-semibold text-indigo-400 hover:underline">Create an organization account</Link>
        </footer>
      </div>
    </main>
  );
}
