"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Building, Zap, Wifi, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function TechnicalStaffRoomsPage() {
  const router = useRouter();

  const rooms = [
    { id: "R001", name: "Hall A — Turing Hall", building: "Building B", floor: "Floor 2", capacity: 150, benches: 30, powerStatus: "HEALTHY", wifiSpeed: "980 Mbps", accessPoints: 4 },
    { id: "R002", name: "Hall B — Lovelace Lab", building: "Building B", floor: "Floor 2", capacity: 125, benches: 25, powerStatus: "HEALTHY", wifiSpeed: "1.1 Gbps", accessPoints: 3 },
    { id: "R003", name: "Suite C — Hopper Center", building: "Building C", floor: "Floor 1", capacity: 100, benches: 20, powerStatus: "HEALTHY", wifiSpeed: "940 Mbps", accessPoints: 3 },
    { id: "R004", name: "Auditorium Main Stage", building: "Central Block", floor: "Ground", capacity: 600, benches: 0, powerStatus: "HEALTHY", wifiSpeed: "1.2 Gbps", accessPoints: 8 },
    { id: "R005", name: "Breakout Room 101", building: "Building A", floor: "Floor 1", capacity: 50, benches: 10, powerStatus: "HEALTHY", wifiSpeed: "850 Mbps", accessPoints: 2 },
    { id: "R006", name: "Hardware Prototyping Lab", building: "Building B", floor: "Basement", capacity: 80, benches: 15, powerStatus: "HEALTHY", wifiSpeed: "750 Mbps", accessPoints: 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/technical-staff")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Dashboard
            </Button>
            <span className="font-mono text-xs text-orange-400 font-bold uppercase">
              Assigned Venues
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Assigned Rooms & Suites</h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry on AC grid load, Wi-Fi access points, and bench occupancy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-400">{room.id}</span>
                  <h3 className="text-sm font-bold text-white">{room.name}</h3>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {room.building} • {room.floor} • Capacity: {room.capacity}
                </div>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Power: <strong className="text-emerald-300">{room.powerStatus}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Wifi className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Speed: <strong className="text-sky-300">{room.wifiSpeed}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
