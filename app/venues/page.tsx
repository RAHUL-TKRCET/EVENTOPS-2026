"use client";

import React, { useState } from "react";
import { RoomMap, BenchMap } from "@/components/ui/RoomMap";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { mockVenues } from "@/lib/mock-data/venues";
import { Venue } from "@/types";
import { Building, Plus, Zap, Wifi, Layers, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VenuesManagementPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>(mockVenues);
  const [selectedVenue, setSelectedVenue] = useState<Venue>(venues[0]);

  const totalBenches = venues.reduce((acc, v) => acc + v.benches.length, 0);
  const occupiedBenches = venues.reduce(
    (acc, v) => acc + v.benches.filter((b) => b.status === "occupied").length,
    0
  );
  const availableBenches = venues.reduce(
    (acc, v) => acc + v.benches.filter((b) => b.status === "available").length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Venues & Bench Topology</h2>
          <p className="text-xs text-slate-400">
            Spatial management of 24 suites, 120 power-ready benches, and domain routing.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push("/venues/create")}
        >
          Add Venue Suite
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard title="Total Facilities" value={venues.length} subtitle="24 Active Suites" icon={<Building className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Total Benches" value={totalBenches} subtitle="120 Benches Mapped" accentColor="sky" icon={<Layers className="w-4 h-4 text-sky-400" />} />
        <KPICard title="Occupied Benches" value={occupiedBenches} subtitle="Teams Deployed" accentColor="emerald" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Available Benches" value={availableBenches} subtitle="Ready for OR-Tools" accentColor="amber" icon={<Zap className="w-4 h-4 text-amber-400" />} />
      </div>

      {/* Selected Room Detailed Bench Map View */}
      {selectedVenue && (
        <div>
          <BenchMap
            venue={selectedVenue}
            onBenchClick={(bench) => {
              if (bench.assignedTeamId) {
                router.push(`/teams/${bench.assignedTeamId}`);
              }
            }}
          />
        </div>
      )}

      {/* Complete Room Map Grid */}
      <div className="pt-2">
        <RoomMap
          venues={venues}
          selectedVenueId={selectedVenue?.id}
          onSelectVenue={(v) => setSelectedVenue(v)}
        />
      </div>
    </div>
  );
}
