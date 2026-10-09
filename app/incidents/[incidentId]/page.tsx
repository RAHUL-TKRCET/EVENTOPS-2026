"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockIncidents } from "@/lib/mock-data/incidents";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { incidentsApi } from "@/lib/api/incidents";
import { ArrowLeft, CheckCircle2, UserCheck, MapPin, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { IncidentStatus } from "@/types";

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.incidentId as string;
  const initial = mockIncidents.find((i) => i.id === incidentId) || mockIncidents[0];

  const [incident, setIncident] = useState(initial);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (nextStatus: IncidentStatus) => {
    setIsUpdating(true);
    const updated = await incidentsApi.updateStatus(incident.id, nextStatus, resolutionNotes);
    setIncident(updated);
    setIsUpdating(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/incidents"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs text-rose-400 font-bold uppercase">{incident.id}</span>
          <h2 className="text-xl font-bold font-mono text-white mt-0.5">{incident.title}</h2>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={incident.priority} />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
              {incident.category}
            </span>
          </div>
          <StatusBadge status={incident.status} />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {incident.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div>Reported By: <span className="text-white font-medium">{incident.reportedBy}</span></div>
          <div>Location: <span className="text-white font-medium">{incident.location}</span></div>
          <div>Assigned To: <span className="text-white font-medium">{incident.assignedTo || "On-Call Dispatch"}</span></div>
          <div>Logged At: <span className="font-mono text-slate-400">{new Date(incident.createdAt).toLocaleTimeString()}</span></div>
        </div>

        {incident.status !== "RESOLVED" ? (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">Resolution Closure</h4>
            <input
              type="text"
              placeholder="Provide technical resolution notes..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                isLoading={isUpdating}
                onClick={() => handleStatusChange("IN_PROGRESS")}
              >
                Mark In Progress
              </Button>
              <Button
                size="sm"
                variant="success"
                isLoading={isUpdating}
                onClick={() => handleStatusChange("RESOLVED")}
              >
                Mark Resolved ✓
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs space-y-1">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Incident Resolved
            </span>
            <p className="text-slate-300">{incident.resolutionNotes || "Issue mitigated and service restored to normal parameters."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
