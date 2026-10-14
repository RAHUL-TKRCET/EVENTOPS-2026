"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, SuperAdminOverview } from "@/lib/api/admin";
import { Button } from "@/components/ui/Button";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  Database,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

function formatDate(value: string | null): string {
  if (!value) return "Time unavailable";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Time unavailable" : parsed.toLocaleString();
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await adminApi.getOverview());
    } catch (requestError) {
      setOverview(null);
      setError(requestError instanceof Error ? requestError.message : "Platform overview could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const metrics = [
    { label: "Organizations", value: overview?.counts.organizations, icon: Building2, tone: "text-indigo-300" },
    { label: "User accounts", value: overview?.counts.users, icon: Users, tone: "text-sky-300" },
    { label: "Events", value: overview?.counts.events, icon: Activity, tone: "text-emerald-300" },
    { label: "Event memberships", value: overview?.counts.eventMembers, icon: ShieldCheck, tone: "text-amber-300" },
  ];

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-purple-300">Platform Governance</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Super Admin</h1>
          <p className="mt-2 text-sm text-slate-400">Global counts and recent audit activity from the protected backend. No fixture metrics are shown.</p>
          {overview?.generatedAt && <p className="mt-1 text-xs text-slate-600">Updated {formatDate(overview.generatedAt)}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>{loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/login")}>Admin login <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </header>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><div><p>{error}</p><p className="mt-1 text-xs text-rose-300/80">This view requires a global Super Admin session. The UI intentionally does not fall back to sample users or organizations.</p></div></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <article key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-400">{metric.label}</p><Icon className={`h-5 w-5 ${metric.tone}`} /></div>
            <p className="mt-3 text-3xl font-bold text-white">{loading ? "…" : metric.value ?? "Unavailable"}</p>
          </article>;
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-white">Event lifecycle</h2><span className="text-xs text-slate-500">{overview?.counts.events ?? "—"} total</span></div>
          {loading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" />Loading event states…</div> : !overview ? <p className="mt-4 text-sm text-slate-500">Event status metrics unavailable.</p> : Object.keys(overview.eventsByStatus).length === 0 ? <p className="mt-4 text-sm text-slate-500">No events recorded.</p> : <div className="mt-4 space-y-3">{Object.entries(overview.eventsByStatus).sort(([a],[b])=>a.localeCompare(b)).map(([status,count])=><div key={status} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3"><span className="text-sm text-slate-300">{status.replaceAll("_"," ")}</span><span className="font-mono text-sm font-semibold text-white">{count}</span></div>)}</div>}
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Database className="h-5 w-5 text-purple-300" /><h2 className="font-semibold text-white">Audit activity</h2></div><span className="text-xs text-slate-500">{overview?.counts.auditRecords ?? "—"} records</span></div>
          {loading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" />Loading audit entries…</div> : !overview ? <p className="mt-4 text-sm text-slate-500">Audit data unavailable.</p> : overview.recentActivity.length === 0 ? <p className="mt-4 text-sm text-slate-500">No audit activity recorded.</p> : <div className="mt-4 space-y-3">{overview.recentActivity.map((item)=><div key={item.id} className="border-b border-slate-800 pb-3 last:border-0"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-white">{item.action.replaceAll("_"," ")}</p><span className="text-[10px] text-slate-500">{formatDate(item.createdAt)}</span></div><p className="mt-1 text-xs text-slate-400">{item.resourceType}{item.resourceId ? ` · ${item.resourceId}` : ""}{item.userRole ? ` · ${item.userRole}` : ""}</p></div>)}</div>}
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="font-semibold text-white">Governance tools</h2>
        <p className="mt-1 text-sm text-slate-400">Protected diagnostics use the backend's Super Admin authorization.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/database" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">Database tools</Link>
          <Link href="/people" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">People & roles</Link>
          <Link href="/events" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">Event directory</Link>
        </div>
      </section>
    </main>
  );
}
