"use client";

import React from "react";
import { ArrowLeft, Cpu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const hardwareItems = [
  { name: "NVIDIA Jetson Orin Nano 8GB", total: 30, allocated: 28, room: "Hardware Vault Lab 102", status: "2 Units Left" },
  { name: "Raspberry Pi 5 Developer Boards", total: 25, allocated: 20, room: "Cache A", status: "5 Units Left" },
  { name: "ESP32 Sensor Dev Kits & Breadboards", total: 50, allocated: 42, room: "Cache B", status: "8 Units Left" },
  { name: "16A Heavy-Duty Surge Strips", total: 80, allocated: 76, room: "Electrical Cache", status: "4 Units Left" },
];

export default function EquipmentManagementPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/resources"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Hardware Vault & Dev Equipment</h2>
          <p className="text-xs text-slate-400">Checkout telemetry for high-value microcontrollers and sensors.</p>
        </div>
      </div>

      <div className="space-y-3">
        {hardwareItems.map((item, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-slate-100">{item.name}</h3>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">{item.room} • {item.allocated}/{item.total} Deployed</p>
            </div>
            <span className="font-mono text-amber-400 font-semibold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
