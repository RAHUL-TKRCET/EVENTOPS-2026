"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { mockUsers } from "@/lib/mock-data/users";
import { User } from "@/types";
import { Users, Shield, Plus, Lock } from "lucide-react";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User Identity",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center text-xs">
            {u.name[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-100">{u.name}</div>
            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Global Role",
      sortable: true,
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: "phone",
      header: "Direct Phone",
      render: (u) => <span className="font-mono text-xs">{u.phone || "—"}</span>,
    },
    {
      key: "createdAt",
      header: "Onboarded",
      render: (u) => <span className="text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "Permissions",
      render: (u) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => alert(`Modifying IAM security scopes for ${u.name}`)}
        >
          Edit IAM
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono">Platform Identity & Access (IAM)</h2>
          <p className="text-xs text-slate-400">
            Global directory across administrators, juries, coordinators, and participants.
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          Invite User
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Identities" value={users.length} subtitle="Active directory records" icon={<Users className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Jury Evaluators" value="20" accentColor="amber" subtitle="Accredited domain experts" icon={<Shield className="w-4 h-4 text-amber-400" />} />
        <KPICard title="Security Compliance" value="MFA Active" accentColor="emerald" subtitle="Enterprise SSO & OAuth2" icon={<Lock className="w-4 h-4 text-emerald-400" />} />
      </div>

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Search users by name, email, or role..."
        searchFilter={(u, q) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
