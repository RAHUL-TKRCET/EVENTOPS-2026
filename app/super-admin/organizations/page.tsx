"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { mockOrganizations } from "@/lib/mock-data/organizations";
import { Organization } from "@/types";
import { Building, Users, Calendar, Plus, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SuperAdminOrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>(mockOrganizations);

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Organization / Tenant",
      sortable: true,
      render: (o) => (
        <div>
          <div className="font-semibold text-slate-100">{o.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">{o.website}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Domain Type",
      sortable: true,
      render: (o) => <span className="font-mono text-xs text-slate-300">{o.type}</span>,
    },
    {
      key: "country",
      header: "Location",
      render: (o) => `${o.city}, ${o.country}`,
    },
    {
      key: "plan",
      header: "Subscription",
      render: (o) => <StatusBadge status={o.plan === "Enterprise" ? "ACTIVE" : "APPROVED"} />,
    },
    {
      key: "membersCount",
      header: "Members",
      sortable: true,
      render: (o) => <span className="font-mono">{o.membersCount}</span>,
    },
    {
      key: "activeEventsCount",
      header: "Events",
      sortable: true,
      render: (o) => <span className="font-mono font-bold text-indigo-400">{o.activeEventsCount}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (o) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            alert(`Managing tenant settings for ${o.name}`);
          }}
        >
          Manage Tenant
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono">Platform Organizations & Tenants</h2>
          <p className="text-xs text-slate-400">
            Multi-tenant control plane across universities, enterprise corporations, and event agencies.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push("/onboarding/organization")}
        >
          Provision Tenant
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Organizations" value={orgs.length} change="+2 this month" changeType="positive" icon={<Building className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Active Events" value="8" change="Across all tenants" accentColor="emerald" icon={<Calendar className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Provisioned Users" value="1,842" change="+12% growth" accentColor="sky" icon={<Users className="w-4 h-4 text-sky-400" />} />
        <KPICard title="Platform Health" value="99.98%" subtitle="Global Edge SLA" accentColor="violet" icon={<Globe className="w-4 h-4 text-violet-400" />} />
      </div>

      <DataTable
        data={orgs}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Filter organizations by name or type..."
        searchFilter={(o, q) =>
          o.name.toLowerCase().includes(q) ||
          o.type.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
