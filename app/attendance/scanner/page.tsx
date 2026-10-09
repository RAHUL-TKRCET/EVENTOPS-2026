"use client";

import React, { useState } from "react";
import { QRScanner } from "@/components/ui/QRCard";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { teamsApi } from "@/lib/api/teams";
import { mockTeams } from "@/lib/mock-data/teams";
import { useAppStore } from "@/store";
import { Team } from "@/types";
import {
  CheckCircle2,
  Users,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Scale,
  Utensils,
  ClipboardCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AttendanceScannerPage() {
  const router = useRouter();
  const { currentRole } = useAppStore();
  const [lastScannedTeam, setLastScannedTeam] = useState<Team | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [scanLog, setScanLog] = useState<{ id: string; name: string; time: string }[]>([]);

  const totalTeams = mockTeams.length;
  const checkedInCount = mockTeams.filter((t) => t.checkInStatus === "CHECKED_IN").length;
  const absentCount = mockTeams.filter((t) => t.checkInStatus === "ABSENT").length;

  const handleScan = async (token: string) => {
    try {
      const res = await teamsApi.scanQrToken(token);
      setLastScannedTeam(res.team);
      setSuccessMessage(res.message);
      setScanLog((prev) => [
        { id: res.team.id, name: res.team.name, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      alert("Invalid QR Token or check-in expired.");
    }
  };

  const getTerminalMeta = () => {
    switch (currentRole) {
      case "JUDGE":
        return {
          title: "Jury Terminal: On-Floor Assigned Team Verification",
          subtitle: "Scan team QR code to verify bench location and open scoring rubric",
          badge: "JUDGE TERMINAL",
          icon: <Scale className="w-4 h-4 text-amber-400" />,
        };
      case "RESOURCE_MANAGER":
        return {
          title: "Resource Manager: Meal & Swag Distribution Terminal",
          subtitle: "Scan attendee badge to verify and record meal or kit distribution",
          badge: "RESOURCE SCANNER",
          icon: <Utensils className="w-4 h-4 text-rose-400" />,
        };
      case "VOLUNTEER":
        return {
          title: "Volunteer Field Terminal: Attendance Check-In",
          subtitle: "Scan attendee badge to confirm entrance and mark checked-in",
          badge: "VOLUNTEER SCANNER",
          icon: <ClipboardCheck className="w-4 h-4 text-teal-400" />,
        };
      case "TECHNICAL_STAFF":
        return {
          title: "Technical Staff: Workstation & Hardware Verification",
          subtitle: "Scan workstation QR code to verify power and network telemetry",
          badge: "TECH TERMINAL",
          icon: <ShieldCheck className="w-4 h-4 text-orange-400" />,
        };
      case "EVENT_ADMIN":
      case "ORGANIZATION_ADMIN":
        return {
          title: "Participant QR Details Obtainer & Verification",
          subtitle: "Scan participant or team QR badge to instantly obtain student profile, team roster, assigned workstation, and verification status",
          badge: "QR DETAILS OBTAINER",
          icon: <Users className="w-4 h-4 text-indigo-400" />,
        };
      default:
        return {
          title: "Participant QR Details Obtainer",
          subtitle: "Scan participant badge to inspect team information, member roster, and workstation allocation",
          badge: "PARTICIPANT INSPECTOR",
          icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
        };
    }
  };

  const terminalMeta = getTerminalMeta();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {terminalMeta.badge}
            </span>
            <StatusBadge status="ACTIVE" />
          </div>
          <h2 className="text-xl font-bold font-mono text-white mt-1">{terminalMeta.title}</h2>
          <p className="text-xs text-slate-400">{terminalMeta.subtitle}</p>
        </div>

        {currentRole !== "JUDGE" && currentRole !== "RESOURCE_MANAGER" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/attendance/teams")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Attendance Registry
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Registered" value={totalTeams} subtitle="Enrolled Teams" icon={<Users className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Verified Checked-In" value={checkedInCount} accentColor="emerald" change={`${Math.round((checkedInCount / totalTeams) * 100)}% present`} changeType="positive" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Pending Arrival" value={absentCount} accentColor="rose" subtitle="Awaiting entry scan" icon={<AlertCircle className="w-4 h-4 text-rose-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Viewfinder Camera Component */}
        <div>
          <QRScanner onScanSuccess={handleScan} />
        </div>

        {/* Right: Last Scanned Confirmation & Audit Feed */}
        <div className="space-y-4">
          {lastScannedTeam ? (
            <div className="p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Verified Successfully</span>
                </div>
                <StatusBadge status="CHECKED_IN" />
              </div>

              <div>
                <span className="font-mono text-xs text-emerald-400 font-bold">{lastScannedTeam.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{lastScannedTeam.name}</h3>
                <p className="text-xs text-slate-300 mt-1">{lastScannedTeam.project.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-emerald-500/20 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Team Lead / Contact:</span>
                  <p className="font-semibold text-slate-200">{lastScannedTeam.leadName} ({lastScannedTeam.leadEmail})</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Domain / Track:</span>
                  <p className="font-mono text-indigo-300 font-semibold">{lastScannedTeam.project.domain}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Assigned Suite:</span>
                  <p className="font-semibold text-slate-200">{lastScannedTeam.assignedVenueName || lastScannedTeam.assignedVenue}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Assigned Bench:</span>
                  <p className="font-mono font-bold text-emerald-300">{lastScannedTeam.assignedBench}</p>
                </div>
              </div>

              {lastScannedTeam.members && lastScannedTeam.members.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Participant Members ({lastScannedTeam.members.length})
                  </span>
                  <div className="divide-y divide-slate-800/80">
                    {lastScannedTeam.members.map((m) => (
                      <div key={m.id} className="py-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-200 font-medium">{m.name} ({m.role})</span>
                        <span className="text-slate-400 font-mono">{m.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Role-Specific Action Button */}
              {currentRole === "JUDGE" ? (
                <Button
                  size="md"
                  variant="primary"
                  className="w-full bg-amber-600 hover:bg-amber-500"
                  onClick={() => router.push(`/judge/evaluation/${lastScannedTeam.id}`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Open Jury Scoring Rubric for {lastScannedTeam.id}
                </Button>
              ) : currentRole === "RESOURCE_MANAGER" ? (
                <Button
                  size="md"
                  variant="primary"
                  className="w-full bg-rose-600 hover:bg-rose-500"
                  onClick={() => router.push("/resource-manager/distribution")}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Record Meal & Swag Distribution
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-white border-emerald-500/40 hover:bg-emerald-500/20"
                  onClick={() => router.push(`/teams/${lastScannedTeam.id}`)}
                >
                  Open Full Team Profile →
                </Button>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-200">Awaiting QR Badge Scan</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Scan attendee badge or select quick test tokens on the left.
              </p>
            </div>
          )}

          {/* Real-time Scan Audit Stream */}
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Terminal Scan History (Live Buffer)
            </h4>
            {scanLog.length === 0 ? (
              <p className="text-xs text-slate-500">No scans recorded in this session yet.</p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs">
                {scanLog.map((log, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-400 mr-2">{log.id}</span>
                      <span className="text-slate-200">{log.name}</span>
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
