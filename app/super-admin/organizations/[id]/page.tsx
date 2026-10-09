"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { mockOrganizations } from "@/lib/mock-data/organizations";
import { mockEvents } from "@/lib/mock-data/events";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  Calendar,
  Users,
  ShieldCheck,
  ArrowLeft,
  Globe,
  MapPin,
  ExternalLink,
  Cpu,
  Layers,
} from "lucide-react";

export default function SuperAdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const org = mockOrganizations.find((o) => o.id === id) || mockOrganizations[0];
  const orgEvents = mockEvents.filter((e) => e.organizationId === org?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/super-admin/organizations")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              All Organizations
            </Button>
            <span className="font-mono text-xs text-purple-400 font-bold uppercase">
              Tenant ID: {org?.id || id}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">{org?.name || "Organization"}</h1>
          <p className="text-xs text-slate-400">
            {org?.type || "Enterprise"} • {org?.city || "Unknown"}, {org?.country || "Region"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {org?.plan || "Standard"} Tier
          </span>
          <StatusBadge status="ACTIVE" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          title="Active Events"
          value={org?.activeEventsCount ?? orgEvents.length}
          subtitle="Hosted on EventOps"
          icon={<Calendar className="w-4 h-4 text-purple-400" />}
        />
        <KPICard
          title="Enrolled Members"
          value={org?.membersCount ?? 0}
          subtitle="Staff & Admins"
          accentColor="sky"
          icon={<Users className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="Organization Size"
          value={org?.size || "Enterprise"}
          subtitle="Estimated Reach"
          accentColor="emerald"
          icon={<Building2 className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Solver Quota"
          value="Unlimited"
          accentColor="indigo"
          subtitle="Enterprise CP-SAT Engine"
          icon={<Cpu className="w-4 h-4 text-indigo-400" />}
        />
      </div>

      {/* Tenant Metadata */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Tenant Specifications & Infrastructure
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">Official Web Domain:</span>
            <div className="flex items-center gap-1.5 text-indigo-400 font-mono">
              <Globe className="w-3.5 h-3.5" />
              <a href={org?.website || "#"} target="_blank" rel="noreferrer" className="hover:underline">
                {org?.website || "N/A"}
              </a>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">Primary Location:</span>
            <div className="flex items-center gap-1.5 text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{org?.city || "N/A"}, {org?.country || "N/A"}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">Provisioned Date:</span>
            <div className="font-mono text-slate-200">
              {org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Active Events Hosted by this Tenant */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Events Operated by {org?.name || "Organization"}
        </h3>

        <div className="divide-y divide-slate-800">
          {(orgEvents.length > 0 ? orgEvents : mockEvents).map((evt) => (
            <div key={evt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{evt.name}</span>
                  <StatusBadge status={evt.status} />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {evt.type} • Expected Participants: {evt.expectedParticipants} • Teams: {evt.registeredTeamsCount}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/events/${evt.id}`)}
              >
                Inspect Event →
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
