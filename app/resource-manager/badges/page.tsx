"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { ArrowLeft, Box, ShieldCheck, QrCode, Printer, Check } from "lucide-react";

export default function ResourceManagerBadgesPage() {
  const router = useRouter();

  const [batches] = useState([
    { id: "BAT-01", name: "Hackers / Participants Badges (120 Teams)", printed: 360, distributed: 360, status: "COMPLETED" },
    { id: "BAT-02", name: "Judges & Juries Special Gold Foil Lanyards", printed: 20, distributed: 20, status: "COMPLETED" },
    { id: "BAT-03", name: "Volunteers & Field Marshals High-Vis Badges", printed: 35, distributed: 35, status: "COMPLETED" },
    { id: "BAT-04", name: "VIP Guests & Keynote Speakers Credentials", printed: 15, distributed: 12, status: "IN_PROGRESS" },
    { id: "BAT-05", name: "Sponsor & Exhibitor Pass Lanyards", printed: 50, distributed: 45, status: "IN_PROGRESS" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/resource-manager")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Dashboard
            </Button>
            <span className="font-mono text-xs text-rose-400 font-bold uppercase">
              Credential Logistics
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Badges & Swag Kits Issuance</h1>
          <p className="text-xs text-slate-400">
            Thermal NFC/QR badge encoding, lanyard allocations, and official hackathon kits
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Printer className="w-4 h-4" />}
          onClick={() => alert("Dispatched batch print request to Central Thermal Badge Printer.")}
        >
          Print Missing Badges
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Printed" value="480 Badges" subtitle="100% Pre-printed" icon={<ShieldCheck className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Distributed at Check-In" value="472 / 480" accentColor="emerald" subtitle="98.3% Collected" icon={<Check className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Unclaimed Badges" value="8 Badges" accentColor="amber" subtitle="Held at Help Desk" icon={<Box className="w-4 h-4 text-amber-400" />} />
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Badge Print & Delivery Batches
        </h3>

        <div className="divide-y divide-slate-800">
          {batches.map((b) => (
            <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400">{b.id}</span>
                  <h4 className="text-sm font-semibold text-white">{b.name}</h4>
                  <StatusBadge status={b.status as any} />
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Printed: {b.printed} • Distributed: {b.distributed}
                </div>
              </div>

              <Button size="sm" variant="outline">
                Batch Log
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
