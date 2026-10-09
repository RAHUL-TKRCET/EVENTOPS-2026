"use client";

import React, { useState } from "react";
import { mockVolunteerTasks } from "@/lib/mock-data/volunteers";
import { VolunteerTask, TaskStatus } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { volunteersApi } from "@/lib/api/volunteers";
import { ArrowLeft, Plus, CheckCircle2, Clock, MapPin, UserCheck } from "lucide-react";
import Link from "next/link";

const columnsStatus: { id: TaskStatus; label: string; color: string }[] = [
  { id: "ASSIGNED", label: "Assigned", color: "border-sky-500/40 text-sky-400" },
  { id: "ACCEPTED", label: "Accepted", color: "border-amber-500/40 text-amber-400" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-indigo-500/40 text-indigo-400" },
  { id: "COMPLETED", label: "Completed", color: "border-emerald-500/40 text-emerald-400" },
];

export default function VolunteerTasksBoardPage() {
  const [tasks, setTasks] = useState<VolunteerTask[]>(mockVolunteerTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const moveTask = async (taskId: string, nextStatus: TaskStatus) => {
    const updated = await volunteersApi.updateTaskStatus(taskId, nextStatus);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const created = await volunteersApi.createTask({
      title: newTaskTitle,
      priority: "HIGH",
    });
    setTasks((prev) => [created, ...prev]);
    setNewTaskTitle("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/volunteers"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold font-mono text-white">Operations Task Kanban</h2>
            <p className="text-xs text-slate-400">
              Live field task progression across logistics, escorts, and turnstiles.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? "Close Form" : "Create Rapid Task"}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateTask} className="p-4 rounded-xl border border-indigo-500/30 bg-slate-900/90 flex gap-2 animate-in fade-in duration-150">
          <input
            type="text"
            placeholder="e.g. Escort Judge J012 to Room 204..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button type="submit" size="sm" variant="primary">
            Dispatch Task
          </Button>
        </form>
      )}

      {/* 4 Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columnsStatus.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3 min-h-[400px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className={`font-mono text-xs font-bold uppercase ${col.color}`}>
                  {col.label}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 hover:border-slate-700 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                        {task.title}
                      </h4>
                      <StatusBadge status={task.priority} />
                    </div>

                    <p className="text-[11px] text-slate-400">{task.description}</p>

                    <div className="space-y-1 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span>{task.zone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>{task.assignedVolunteerName}</span>
                      </div>
                    </div>

                    {/* Step forward button */}
                    <div className="pt-2 flex justify-end">
                      {task.status === "ASSIGNED" && (
                        <button
                          onClick={() => moveTask(task.id, "ACCEPTED")}
                          className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20"
                        >
                          Accept →
                        </button>
                      )}
                      {task.status === "ACCEPTED" && (
                        <button
                          onClick={() => moveTask(task.id, "IN_PROGRESS")}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20"
                        >
                          Start →
                        </button>
                      )}
                      {task.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => moveTask(task.id, "COMPLETED")}
                          className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                        >
                          Complete ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
