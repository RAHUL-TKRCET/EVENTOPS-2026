"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockOrganizations } from "@/lib/mock-data/organizations";
import { mockUsers } from "@/lib/mock-data/users";
import {
  Building,
  Users,
  ShieldCheck,
  BarChart3,
  Server,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

export default function SuperAdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Super Admin Banner */}
      <div className="p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
              Super Admin Control Plane
            </span>
            <StatusBadge status="ACTIVE" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            Global Platform Governance
          </h1>
          <p className="text-xs text-slate-400">
            Multi-tenant infrastructure, organization quotas, and cross-cluster analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push("/super-admin/analytics")}
            leftIcon={<BarChart3 className="w-4 h-4 text-purple-400" />}
          >
            Platform Analytics
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push("/super-admin/organizations")}
            leftIcon={<Building className="w-4 h-4" />}
          >
            Manage Tenants
          </Button>
        </div>
      </div>

      {/* Global Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          title="Active Tenants"
          value={mockOrganizations.length}
          subtitle="Universities & Enterprises"
          icon={<Building className="w-4 h-4 text-purple-400" />}
        />
        <KPICard
          title="Total Platform Users"
          value="1,420"
          accentColor="sky"
          subtitle="Across 9 RBAC Roles"
          icon={<Users className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="System Health"
          value="99.99%"
          accentColor="emerald"
          subtitle="All Clusters Healthy"
          icon={<Server className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="CP-SAT Solver Load"
          value="142 Jobs"
          accentColor="indigo"
          subtitle="Avg runtime 420ms"
          icon={<Cpu className="w-4 h-4 text-indigo-400" />}
        />
      </div>

      {/* Managed Organizations Preview */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Tenant Registry Overview
            </h3>
            <p className="text-xs text-slate-400">
              Provisioned organizations, subscription tiers, and active workloads
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/super-admin/organizations")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All Tenants
          </Button>
        </div>

        <div className="divide-y divide-slate-800">
          {mockOrganizations.map((org) => (
            <div key={org.id} className="py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-sm">{org.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {org.plan} Plan
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {org.city}, {org.country} • {org.type}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-400">
                  <strong className="text-white">{org.activeEventsCount}</strong> Active Events
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                >
                  Inspect
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs font-mono uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Admins</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage root administrators, security policies, and enterprise tenant owners.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/super-admin/admins")}
          >
            Admin Management →
          </Button>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs font-mono uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>Telemetry & Analytics</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review multi-tenant usage, compute consumption, and CP-SAT scheduler latencies.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/super-admin/analytics")}
          >
            View Analytics →
          </Button>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono uppercase">
            <Server className="w-4 h-4" />
            <span>System Settings</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure global feature flags, OAuth providers, and rate limits.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/super-admin/settings")}
          >
            System Settings →
          </Button>
        </div>
      </div>
    </div>
  );
}
