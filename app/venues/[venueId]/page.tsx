"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockVenues } from "@/lib/mock-data/venues";
import { BenchMap } from "@/components/ui/RoomMap";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Building, Zap, Wifi, Layers } from "lucide-react";
import Link from "next/link";

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params.venueId as string;

  const venue = mockVenues.find((v) => v.id === venueId) || mockVenues[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/venues"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400">{venue.id}</span>
              <StatusBadge status={venue.status} />
              <span className="text-xs text-slate-400">{venue.building} • {venue.floor}</span>
            </div>
            <h2 className="text-xl font-bold font-mono text-white mt-1">{venue.name}</h2>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/venues/${venue.id}/benches`)}
        >
          Manage Benches ({venue.benches.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 text-xs space-y-1">
          <span className="text-slate-500">Total Benches</span>
          <p className="text-xl font-bold font-mono text-white">{venue.benches.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 text-xs space-y-1">
          <span className="text-slate-500">Occupancy</span>
          <p className="text-xl font-bold font-mono text-emerald-400">
            {venue.benches.filter((b) => b.status === "occupied").length} / {venue.benches.length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 text-xs space-y-1">
          <span className="text-slate-500">Power Rating</span>
          <p className="text-sm font-semibold text-slate-200">16A Dedicated RCD</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 text-xs space-y-1">
          <span className="text-slate-500">Network Uplink</span>
          <p className="text-sm font-semibold text-slate-200">10Gbps Optical Fiber</p>
        </div>
      </div>

      {/* Visual Interactive Bench Map */}
      <BenchMap
        venue={venue}
        onBenchClick={(bench) => {
          if (bench.assignedTeamId) {
            router.push(`/teams/${bench.assignedTeamId}`);
          }
        }}
      />
    </div>
  );
}
