"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store";
import { volunteersApi, VolunteerTaskItem, VolunteerTaskStatus, VolunteerWorkspace } from "@/lib/api/volunteers";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2, Clock3, HeartHandshake, LoaderCircle, MapPin, RefreshCw } from "lucide-react";

function nextAction(status: VolunteerTaskStatus): { label: string; next: VolunteerTaskStatus } | null {
  if (status === "PENDING" || status === "ASSIGNED") return { label: "Accept task", next: "ACCEPTED" };
  if (status === "ACCEPTED") return { label: "Start task", next: "IN_PROGRESS" };
  if (status === "IN_PROGRESS") return { label: "Complete task", next: "COMPLETED" };
  return null;
}

function displayDate(value: string | null): string {
  if (!value) return "No due time set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Due time unavailable" : parsed.toLocaleString();
}

export default function VolunteersPage() {
  const params = useSearchParams();
  const { currentEvent } = useAppStore();
  const eventId = (params.get("eventId") || currentEvent?.id || "").trim();
  const [workspace, setWorkspace] = useState<VolunteerWorkspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!eventId) {
      setWorkspace(null);
      setError("No event is selected. Open Volunteer Login from the event-specific login link, then return to this workspace.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setWorkspace(await volunteersApi.getMine(eventId));
    } catch (requestError) {
      setWorkspace(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to load your event-scoped tasks.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(task: VolunteerTaskItem, status: VolunteerTaskStatus) {
    setUpdatingId(task.id);
    setNotice("");
    setError("");
    try {
      const updated = await volunteersApi.updateTaskStatus(task.id, status);
      setWorkspace((current) => current ? {
        ...current,
        tasks: current.tasks.map((item) => item.id === updated.id ? updated : item),
      } : current);
      setNotice("Task status saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Task status could not be saved.");
    } finally {
      setUpdatingId(null);
    }
  }

  const tasks = workspace?.tasks ?? [];
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-teal-500/20 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-teal-300">Volunteer Workspace</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{workspace?.eventName || "Assigned event tasks"}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {workspace ? `${workspace.volunteer.name} · ${workspace.volunteer.role} · ${workspace.volunteer.zone}` : "Tasks and updates are loaded from the event API."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh tasks
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">Assigned tasks</p><p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : tasks.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">Completed</p><p className="mt-2 text-2xl font-bold text-emerald-300">{loading ? "…" : completed}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">Remaining</p><p className="mt-2 text-2xl font-bold text-amber-200">{loading ? "…" : tasks.length - completed}</p></div>
      </section>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}
      {notice && <div role="status" className="flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
      {loading && <div role="status" className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin" />Loading assigned tasks…</div>}

      {!loading && !error && tasks.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"><HeartHandshake className="mx-auto h-8 w-8 text-teal-300" /><h2 className="mt-3 font-semibold text-white">No tasks assigned</h2><p className="mt-2 text-sm text-slate-400">Your coordinator has not assigned tasks to this volunteer account yet.</p></div>}

      <section className="space-y-3">
        {tasks.map((task) => {
          const action = nextAction(task.status);
          return <article key={task.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{task.status.replaceAll("_", " ")}</span><span className="font-mono text-xs text-slate-500">{task.id}</span></div>
                <h2 className="mt-3 text-lg font-semibold text-white">{task.title}</h2>
                {task.description && <p className="mt-2 text-sm leading-6 text-slate-300">{task.description}</p>}
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4" />{task.zone || workspace?.volunteer.zone || "Zone not assigned"}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-400"><Clock3 className="h-4 w-4" />{displayDate(task.dueTime)}</p>
              </div>
              {action ? <Button type="button" variant="primary" disabled={updatingId === task.id} isLoading={updatingId === task.id} onClick={() => void updateStatus(task, action.next)}>{action.label}</Button> : <span className="text-sm font-medium text-emerald-300">Task complete</span>}
            </div>
          </article>;
        })}
      </section>
    </main>
  );
}
