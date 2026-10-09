"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ArrowLeft, Box, QrCode, Search, CheckCircle2 } from "lucide-react";

export default function TechnicalStaffEquipmentPage() {
  const router = useRouter();

  const [equipmentList] = useState([
    { id: "EQ-101", name: "Cisco Catalyst 9300 Wi-Fi 6 AP", location: "Suite B201", status: "HEALTHY", count: 4 },
    { id: "EQ-102", name: "APC Smart-UPS 3000VA Backup", location: "SR-01 Server Room", status: "HEALTHY", count: 2 },
    { id: "EQ-103", name: "4K Laser Presentation Projector", location: "Grand Auditorium", status: "HEALTHY", count: 2 },
    { id: "EQ-104", name: "High-Power AC Surge Extension Benches", location: "Turing Hall (All Benches)", status: "HEALTHY", count: 30 },
    { id: "EQ-105", name: "HDMI 2.1 Optical Fiber Runs", location: "Presentation Pods", status: "HEALTHY", count: 8 },
    { id: "EQ-106", name: "Raspberry Pi 5 Developer Boards (Checkout Pool)", location: "Hardware Lab", status: "LOW_STOCK", count: 12 },
  ]);

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
              Inventory & Hardware
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Equipment Registry</h1>
          <p className="text-xs text-slate-400">
            A/V rigs, networking switches, UPS power modules, and hardware checkout inventory
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<QrCode className="w-4 h-4" />}
          onClick={() => router.push("/attendance/scanner")}
        >
          Scan Equipment Barcode
        </Button>
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Provisioned Technical Equipment ({equipmentList.length} Categories)
        </h3>

        <div className="divide-y divide-slate-800">
          {equipmentList.map((eq) => (
            <div key={eq.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-orange-400">{eq.id}</span>
                  <h4 className="text-xs font-semibold text-white">{eq.name}</h4>
                  <StatusBadge status={eq.status as any} />
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Deployed: {eq.location} • Available Units: <strong className="text-slate-200">{eq.count}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  Run Diagnostic
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
