"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { mockVenues } from "@/lib/mock-data/venues";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Bench } from "@/types";
import { ArrowLeft, Zap, Wifi } from "lucide-react";
import Link from "next/link";

export default function VenueBenchesPage() {
  const params = useParams();
  const venueId = params.venueId as string;
  const venue = mockVenues.find((v) => v.id === venueId) || mockVenues[0];

  const [benches, setBenches] = useState<Bench[]>(venue.benches);

  const toggleStatus = (benchId: string) => {
    setBenches((prev) =>
      prev.map((b) => {
        if (b.id === benchId) {
          const nextStatus: Bench["status"] = b.status === "available" ? "occupied" : "available";
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
  };

  const columns: Column<Bench>[] = [
    {
      key: "id",
      header: "Bench ID",
      sortable: true,
      className: "w-24 font-mono font-bold text-indigo-400",
    },
    {
      key: "label",
      header: "Physical Label",
      sortable: true,
      render: (b) => <span className="font-semibold text-slate-100">{b.label}</span>,
    },
    {
      key: "status",
      header: "Occupancy Status",
      sortable: true,
      render: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "assignedTeamName",
      header: "Assigned Team",
      render: (b) => (
        <span className="text-xs text-slate-300">
          {b.assignedTeamName || <span className="text-slate-500 italic">Unallocated</span>}
        </span>
      ),
    },
    {
      key: "utilities",
      header: "Prerequisites",
      render: (b) => (
        <div className="flex items-center gap-2 text-xs">
          {b.hasPower && <span className="flex items-center text-amber-400 gap-1"><Zap className="w-3 h-3" /> 16A</span>}
          {b.hasEthernet && <span className="flex items-center text-sky-400 gap-1"><Wifi className="w-3 h-3" /> LAN</span>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Override",
      render: (b) => (
        <button
          onClick={() => toggleStatus(b.id)}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
        >
          Toggle Status
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/venues/${venue.id}`}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Bench Inventory: {venue.name}</h2>
          <p className="text-xs text-slate-400">Manage individual workstation power lines and occupancy.</p>
        </div>
      </div>

      <DataTable
        data={benches}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search benches..."
      />
    </div>
  );
}
