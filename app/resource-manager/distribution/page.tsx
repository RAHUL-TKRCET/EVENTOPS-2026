"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/ui/QRCard";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockTeams } from "@/lib/mock-data/teams";
import { Team } from "@/types";
import {
  Utensils,
  Box,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Check,
  AlertCircle,
  Shirt,
} from "lucide-react";

export default function ResourceManagerDistributionPage() {
  const router = useRouter();
  const [scannedTeam, setScannedTeam] = useState<Team | null>(null);
  const [dispenseLog, setDispenseLog] = useState<{ id: string; name: string; item: string; time: string }[]>([]);
  const [claimedItems, setClaimedItems] = useState<Record<string, { meal: boolean; kit: boolean }>>({});

  const handleScan = (token: string) => {
    // Lookup team by token or ID
    let found = mockTeams.find((t) => t.qrCodeToken === token || t.id.toLowerCase() === token.toLowerCase());
    if (!found) {
      found = mockTeams[0]; // fallback demo
    }
    setScannedTeam(found);
  };

  const handleDispense = (itemType: "meal" | "kit") => {
    if (!scannedTeam) return;

    setClaimedItems((prev) => ({
      ...prev,
      [scannedTeam.id]: {
        ...prev[scannedTeam.id],
        [itemType]: true,
      },
    }));

    setDispenseLog((prev) => [
      {
        id: scannedTeam.id,
        name: scannedTeam.name,
        item: itemType === "meal" ? "Buffet Meal (VEG)" : "Swag Kit + Lanyard",
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  const isMealClaimed = scannedTeam ? claimedItems[scannedTeam.id]?.meal : false;
  const isKitClaimed = scannedTeam ? claimedItems[scannedTeam.id]?.kit : false;

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
              Resource Dashboard
            </Button>
            <span className="font-mono text-xs text-rose-400 font-bold uppercase">
              Distribution Desk Terminal
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Resource & Meal QR Scanner</h1>
          <p className="text-xs text-slate-400">
            Scan attendee badges to record meal pickups and distribute merchandise kits
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Scanner Component */}
        <div>
          <QRScanner onScanSuccess={handleScan} />
        </div>

        {/* Verification and Dispense Actions */}
        <div className="space-y-4">
          {scannedTeam ? (
            <div className="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-mono font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Participant Badge Verified</span>
                </div>
                <StatusBadge status="CHECKED_IN" />
              </div>

              <div>
                <span className="font-mono text-xs text-rose-400 font-bold">{scannedTeam.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{scannedTeam.name}</h3>
                <p className="text-xs text-slate-300 mt-1">{scannedTeam.leadName} ({scannedTeam.members.length} Members)</p>
              </div>

              {/* Resource Entitlements */}
              <div className="space-y-3 pt-2 border-t border-rose-500/20">
                <h4 className="text-xs font-mono uppercase text-slate-300">Available Entitlements</h4>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Lunch Meal Token</div>
                      <div className="text-[10px] text-slate-400">Dietary: {scannedTeam.members[0]?.dietaryPreference || "VEG"}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isMealClaimed ? "outline" : "primary"}
                    disabled={isMealClaimed}
                    onClick={() => handleDispense("meal")}
                    leftIcon={isMealClaimed ? <Check className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isMealClaimed ? "Served" : "Dispense Meal"}
                  </Button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Box className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Official Swag Pack</div>
                      <div className="text-[10px] text-slate-400">Hoodie Size: {scannedTeam.members[0]?.tShirtSize || "L"}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isKitClaimed ? "outline" : "primary"}
                    disabled={isKitClaimed}
                    onClick={() => handleDispense("kit")}
                    leftIcon={isKitClaimed ? <Check className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isKitClaimed ? "Claimed" : "Dispense Kit"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-200">Awaiting Badge Scan</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Scan attendee QR using camera or click quick test badges on the left.
              </p>
            </div>
          )}

          {/* Real-time Distribution Log */}
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Recent Resource Dispatches
            </h4>
            {dispenseLog.length === 0 ? (
              <p className="text-xs text-slate-500">No items dispensed in this terminal session yet.</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {dispenseLog.map((log, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-rose-400 mr-2">{log.id}</span>
                      <span className="text-slate-200">{log.item}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">{log.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
