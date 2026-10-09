"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { mockTeams } from "@/lib/mock-data/teams";
import { Team, CheckInStatus } from "@/types";
import { QrCode, CheckCircle, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AttendanceTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = statusFilter === "ALL"
    ? teams
    : teams.filter((t) => t.checkInStatus === statusFilter);

  const toggleCheckIn = (teamId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const nextStatus: CheckInStatus = t.checkInStatus === "CHECKED_IN" ? "ABSENT" : "CHECKED_IN";
          return {
            ...t,
            checkInStatus: nextStatus,
            checkedInTime: nextStatus === "CHECKED_IN" ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const columns: Column<Team>[] = [
    {
      key: "id",
      header: "Team ID",
      sortable: true,
      className: "w-24 font-mono font-bold text-indigo-400",
    },
    {
      key: "name",
      header: "Team Name & Project",
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-100">{t.name}</div>
          <div className="text-[11px] text-slate-500">{t.leadName} • {t.project.domain}</div>
        </div>
      ),
    },
    {
      key: "checkInStatus",
      header: "Check-in Status",
      sortable: true,
      render: (t) => <StatusBadge status={t.checkInStatus} />,
    },
    {
      key: "checkedInTime",
      header: "Timestamp",
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs text-slate-400">
          {t.checkedInTime ? new Date(t.checkedInTime).toLocaleTimeString() : "—"}
        </span>
      ),
    },
    {
      key: "assignedBench",
      header: "Allocated Bench",
      render: (t) => (
        <span className="font-mono text-xs text-slate-300">
          {t.assignedVenueName || t.assignedVenue} ({t.assignedBench})
        </span>
      ),
    },
    {
      key: "actions",
      header: "Override",
      render: (t) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCheckIn(t.id);
          }}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          {t.checkInStatus === "CHECKED_IN" ? "Set Absent" : "Check In ✓"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Live Attendance Registry</h2>
          <p className="text-xs text-slate-400">
            Real-time audit records across 120 teams for physical turnstiles and security gates.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<QrCode className="w-4 h-4" />}
          onClick={() => router.push("/attendance/scanner")}
        >
          Open Scanner Viewfinder
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "CHECKED_IN", "ABSENT", "PARTIAL"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              statusFilter === st
                ? "bg-indigo-600 text-white font-bold"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {st} ({st === "ALL" ? teams.length : teams.filter((t) => t.checkInStatus === st).length})
          </button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search team attendance..."
        searchFilter={(t, q) =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.leadName.toLowerCase().includes(q)
        }
        onRowClick={(t) => router.push(`/teams/${t.id}`)}
      />
    </div>
  );
}
