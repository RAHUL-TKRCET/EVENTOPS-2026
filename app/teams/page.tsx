"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { mockTeams } from "@/lib/mock-data/teams";
import { Team } from "@/types";
import { Users, QrCode, Plus, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeamsListPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [domainFilter, setDomainFilter] = useState<string>("ALL");

  const domains = [
    "ALL",
    "AI / Machine Learning",
    "Distributed Systems / Web3",
    "FinTech & Payments",
    "HealthTech & Bio",
    "IoT & Robotics",
    "CleanTech & Green Energy",
    "CyberSecurity",
  ];

  const filteredTeams = domainFilter === "ALL"
    ? teams
    : teams.filter((t) => t.project.domain === domainFilter);

  const columns: Column<Team>[] = [
    {
      key: "id",
      header: "Team ID",
      sortable: true,
      className: "w-24 font-mono font-bold text-indigo-400",
    },
    {
      key: "name",
      header: "Team & Project Title",
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-100">{t.name}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{t.project.title}</div>
        </div>
      ),
    },
    {
      key: "domain",
      header: "Domain Track",
      sortable: true,
      render: (t) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
          {t.project.domain}
        </span>
      ),
    },
    {
      key: "leadName",
      header: "Captain & Size",
      render: (t) => (
        <div className="text-xs">
          <div className="text-slate-200">{t.leadName}</div>
          <div className="text-[10px] text-slate-500 font-mono">{t.members.length} members</div>
        </div>
      ),
    },
    {
      key: "checkInStatus",
      header: "Check-In",
      sortable: true,
      render: (t) => <StatusBadge status={t.checkInStatus} />,
    },
    {
      key: "assignedBench",
      header: "Allocated Bench",
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs text-slate-300">
          {t.assignedVenueName || t.assignedVenue} • <span className="font-bold text-white">{t.assignedBench}</span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "Profile",
      render: (t) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/teams/${t.id}`)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono">Registered Innovation Teams</h2>
          <p className="text-xs text-slate-400">
            {teams.length} teams participating in VISTRA Hackathon 2026.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<QrCode className="w-4 h-4 text-indigo-400" />}
            onClick={() => router.push("/attendance/scanner")}
          >
            Scanner
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/teams/register")}
          >
            Register Team
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Enrolled" value={teams.length} subtitle="120 target capacity reached" icon={<Users className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Checked-In" value={teams.filter((t) => t.checkInStatus === "CHECKED_IN").length} accentColor="emerald" change="95% present" changeType="positive" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Absent / Not Checked In" value={teams.filter((t) => t.checkInStatus === "ABSENT").length} accentColor="rose" subtitle="Pending gate validation" icon={<XCircle className="w-4 h-4 text-rose-400" />} />
      </div>

      {/* Domain Track Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {domains.map((dom) => (
          <button
            key={dom}
            onClick={() => setDomainFilter(dom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap cursor-pointer ${
              domainFilter === dom
                ? "bg-indigo-600 text-white font-bold"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {dom}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredTeams}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search by team name, ID (e.g. T042), or project title..."
        searchFilter={(t, q) =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.leadName.toLowerCase().includes(q) ||
          t.project.title.toLowerCase().includes(q) ||
          t.project.domain.toLowerCase().includes(q)
        }
        onRowClick={(t) => router.push(`/teams/${t.id}`)}
      />
    </div>
  );
}
