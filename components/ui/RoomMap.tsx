"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Venue, Bench } from "@/types";
import { Zap, Wifi, Users, Wrench, Shield, CheckCircle } from "lucide-react";
import { StatusBadge } from "./Badge";

export interface RoomMapProps {
  venues: Venue[];
  onSelectVenue?: (venue: Venue) => void;
  selectedVenueId?: string;
  className?: string;
}

export const RoomMap: React.FC<RoomMapProps> = ({
  venues,
  onSelectVenue,
  selectedVenueId,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Spatial Venue Matrix ({venues.length} Facilities Active)
        </h4>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Standby
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Maintenance
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {venues.map((venue) => {
          const isSelected = selectedVenueId === venue.id;
          const occupiedCount = venue.benches.filter((b) => b.status === "occupied").length;
          const totalBenches = venue.benches.length;
          const occupancyPct = Math.round((occupiedCount / totalBenches) * 100);

          return (
            <div
              key={venue.id}
              onClick={() => onSelectVenue && onSelectVenue(venue)}
              className={cn(
                "p-4 rounded-xl border bg-slate-900/70 hover:bg-slate-800/80 transition cursor-pointer space-y-3 relative overflow-hidden",
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-800/90"
                  : "border-slate-800"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase">
                    {venue.id} • {venue.floor}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-100 truncate mt-0.5">
                    {venue.name.split(" - ")[0]}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">{venue.building}</p>
                </div>
                <StatusBadge status={venue.status} />
              </div>

              {/* Bench mini-grid snapshot */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {venue.benches.map((bench) => {
                  const benchColor =
                    bench.status === "occupied"
                      ? "bg-indigo-500 text-white"
                      : bench.status === "available"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : bench.status === "reserved"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30";

                  return (
                    <div
                      key={bench.id}
                      title={`${bench.label} - ${bench.status}`}
                      className={cn(
                        "h-6 rounded flex items-center justify-center font-mono text-[9px] font-semibold transition",
                        benchColor
                      )}
                    >
                      {bench.id.replace("B", "")}
                    </div>
                  );
                })}
              </div>

              {/* Utility Badges */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span title="Power Ready" className="flex items-center text-amber-400">
                    <Zap className="w-3 h-3" />
                  </span>
                  <span title="Ethernet LAN" className="flex items-center text-sky-400">
                    <Wifi className="w-3 h-3" />
                  </span>
                </div>
                <span className="font-mono text-slate-300">
                  {occupiedCount}/{totalBenches} ({occupancyPct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface BenchMapProps {
  venue: Venue;
  onBenchClick?: (bench: Bench) => void;
  className?: string;
}

export const BenchMap: React.FC<BenchMapProps> = ({ venue, onBenchClick, className }) => {
  const [selectedBench, setSelectedBench] = useState<Bench | null>(venue.benches[0] || null);

  const getStatusColor = (status: Bench["status"]) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20";
      case "occupied":
        return "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500";
      case "reserved":
        return "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30";
      case "maintenance":
        return "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30";
    }
  };

  return (
    <div className={cn("p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase font-bold tracking-wider">
            Floorplan Detail: {venue.id}
          </span>
          <h3 className="text-base font-semibold text-slate-100">{venue.name}</h3>
          <p className="text-xs text-slate-400">{venue.building} • {venue.floor}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" /> Available
          </span>
          <span className="flex items-center gap-1.5 text-indigo-300">
            <span className="w-3 h-3 rounded bg-indigo-600 border border-indigo-500" /> Occupied
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" /> Reserved
          </span>
          <span className="flex items-center gap-1.5 text-rose-300">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40" /> Maintenance
          </span>
        </div>
      </div>

      {/* Room Stage Layout Visual */}
      <div className="space-y-3">
        <div className="w-full py-2 bg-slate-950/80 border border-dashed border-slate-700 rounded-lg text-center font-mono text-xs text-slate-400 uppercase tracking-widest">
          🖥️ Projector Screen / Evaluator Presentation Pulpit
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-2">
          {venue.benches.map((bench) => {
            const isCurrent = selectedBench?.id === bench.id;
            return (
              <div
                key={bench.id}
                onClick={() => {
                  setSelectedBench(bench);
                  if (onBenchClick) onBenchClick(bench);
                }}
                className={cn(
                  "p-3.5 rounded-xl border flex flex-col items-center text-center transition cursor-pointer space-y-2 select-none",
                  getStatusColor(bench.status),
                  isCurrent && "ring-2 ring-white"
                )}
              >
                <span className="text-xs font-mono font-bold">{bench.label}</span>
                <span className="text-[10px] uppercase font-mono tracking-tight opacity-90">
                  {bench.status}
                </span>

                {bench.assignedTeamName && (
                  <p className="text-[11px] font-semibold truncate w-full pt-1 border-t border-white/10">
                    {bench.assignedTeamName}
                  </p>
                )}

                <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                  {bench.hasPower && <Zap className="w-3 h-3 text-amber-400" />}
                  {bench.hasEthernet && <Wifi className="w-3 h-3 text-sky-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Bench Inspector Drawer Snippet */}
      {selectedBench && (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-mono text-indigo-400 font-bold">{selectedBench.id}</span>
            <h5 className="font-semibold text-slate-100">{selectedBench.label} — Status: {selectedBench.status.toUpperCase()}</h5>
            <p className="text-slate-400 mt-0.5">
              {selectedBench.assignedTeamId ? `Assigned to: ${selectedBench.assignedTeamName} (${selectedBench.assignedTeamId})` : "Unassigned. Available for OR-Tools allocation."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-mono">16A Power: {selectedBench.hasPower ? "YES" : "NO"}</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-mono">10G LAN: {selectedBench.hasEthernet ? "YES" : "NO"}</span>
          </div>
        </div>
      )}
    </div>
  );
};
