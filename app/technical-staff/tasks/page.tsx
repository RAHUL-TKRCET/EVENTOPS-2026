"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ArrowLeft, CheckCircle2, Clock, Check, AlertTriangle, Plus } from "lucide-react";

export default function TechnicalStaffTasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState([
    { id: "T-01", title: "Deploy 5GHz Wi-Fi Access Point in Suite B204", room: "B204", status: "PENDING", priority: "HIGH" },
    { id: "T-02", title: "Check 230V AC Surge Breakers in Turing Hall", room: "Turing Hall", status: "COMPLETED", priority: "URGENT" },
    { id: "T-03", title: "Replace HDMI Extender Cable on Main Projector", room: "Hall Alpha", status: "IN_PROGRESS", priority: "MEDIUM" },
    { id: "T-04", title: "Verify Backup UPS Battery Level in Server Room", room: "SR-01", status: "COMPLETED", priority: "HIGH" },
    { id: "T-05", title: "Inspect Audio Wireless Microphones for Opening Ceremony", room: "Auditorium", status: "PENDING", priority: "HIGH" },
  ]);

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "COMPLETED" ? "PENDING" : "COMPLETED" }
          : t
      )
    );
  };

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
              Field Work Orders
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Technical Tasks & Tickets</h1>
          <p className="text-xs text-slate-400">
            Work order lifecycle: Assigned → In Progress → Verified & Closed
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push("/incidents/create")}
        >
          Create Work Order
        </Button>
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Active Technical Tasks ({tasks.length})
        </h3>

        <div className="space-y-3">
          {tasks.map((task) => {
            const isDone = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isDone
                    ? "border-emerald-500/20 bg-emerald-500/5 opacity-80"
                    : "border-slate-800 bg-slate-950"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-400">{task.id}</span>
                    <span className={`font-semibold ${isDone ? "line-through text-slate-400" : "text-white text-sm"}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Room: <strong className="text-slate-200">{task.room}</strong> • Priority: <span className="text-amber-400 font-bold">{task.priority}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleTask(task.id)}
                  className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 font-mono text-xs self-start sm:self-auto ${
                    isDone
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isDone ? "Completed" : "Mark Complete"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
