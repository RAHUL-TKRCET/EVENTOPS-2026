"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import {
  volunteersApi,
  VolunteerAssignment,
  VolunteerTaskItem,
  VolunteerTaskStatus,
} from "@/lib/api/volunteers";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";

const columns: { id: VolunteerTaskStatus; label: string; tone: string }[] = [
  { id: "PENDING", label: "Pending", tone: "text-slate-300 border-slate-700" },
  { id: "ASSIGNED", label: "Assigned", tone: "text-sky-300 border-sky-500/30" },
  { id: "ACCEPTED", label: "Accepted", tone: "text-amber-300 border-amber-500/30" },
  { id: "IN_PROGRESS", label: "In progress", tone: "text-indigo-300 border-indigo-500/30" },
  { id: "COMPLETED", label: "Completed", tone: "text-emerald-300 border-emerald-500/30" },
];

function formatDue(value: string | null): string {
  if (!value) return "No due time";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Due time unavailable" : date.toLocaleString();
}

export default function VolunteerTasksBoardPage() {
  const params = useSearchParams();
  const { currentEvent } = useAppStore();
  const eventId = (params.get("eventId") || currentEvent?.id || "").trim();
  const [tasks, setTasks] = useState<VolunteerTaskItem[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!eventId) {
      setTasks([]);
      setAssignments([]);
      setError("No event is selected. Open task management from an event-specific operations workspace.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [taskRows, volunteerRows] = await Promise.all([
        volunteersApi.getTasks(eventId),
        volunteersApi.getAssignments(eventId),
      ]);
      setTasks(taskRows);
      setAssignments(volunteerRows);
      setVolunteerId((current) => current || volunteerRows[0]?.id || "");
    } catch (requestError) {
      setTasks([]);
      setAssignments([]);
      setError(requestError instanceof Error ? requestError.message : "Unable to load event task data.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!eventId || !title.trim()) return;
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const created = await volunteersApi.createTask({
        eventId,
        title,
        description,
        zone,
        ...(volunteerId ? { volunteerId } : {}),
      });
      setTasks((current) => [...current, created].sort((a, b) => {
        const aDue = a.dueTime ? Date.parse(a.dueTime) : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueTime ? Date.parse(b.dueTime) : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      }));
      setTitle("");
      setDescription("");
      setZone("");
      setShowCreate(false);
      setNotice("Task saved to the event. Assigned volunteers can update its status from their workspace.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Task could not be saved.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href={eventId ? `/control-center?eventId=${encodeURIComponent(eventId)}` : "/control-center"} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Volunteer Task Board</h1>
            <p className="mt-1 text-sm text-slate-400">Persisted task status for the selected event. No demo tasks are shown.</p>
            {eventId && <p className="mt-1 font-mono text-xs text-slate-500">Event ID: {eventId}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => void load()}>
            {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh
          </Button>
          <Button type="button" variant="primary" disabled={!eventId} onClick={() => setShowCreate((open) => !open)}>
            <Plus className="mr-2 h-4 w-4" />{showCreate ? "Close form" : "Create task"}
          </Button>
        </div>
      </header>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200">{notice}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-2xl border border-indigo-500/30 bg-slate-900 p-5 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-300">Task title
            <input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" placeholder="Set up check-in desk" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Assigned volunteer (optional)
            <select value={volunteerId} onChange={(event) => setVolunteerId(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
              <option value="">Unassigned task</option>
              {assignments.map((volunteer) => <option key={volunteer.id} value={volunteer.id}>{volunteer.name} · {volunteer.zone}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">Zone / location
            <input maxLength={100} value={zone} onChange={(event) => setZone(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" placeholder="Main entrance" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Description (optional)
            <input value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" placeholder="Instructions for the assigned volunteer" />
          </label>
          <div className="md:col-span-2"><Button type="submit" variant="primary" disabled={creating || !title.trim()} isLoading={creating}>Save task</Button></div>
          {assignments.length === 0 && <p className="md:col-span-2 text-xs text-amber-200">No active volunteer assignments are available for this event yet. You can save an unassigned task.</p>}
        </form>
      )}

      {loading && <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin" />Loading tasks…</div>}

      {!loading && !error && tasks.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"><CalendarClock className="mx-auto h-8 w-8 text-indigo-300" /><h2 className="mt-3 font-semibold text-white">No tasks created for this event</h2><p className="mt-2 text-sm text-slate-400">Create a task to persist it and optionally assign an active volunteer.</p></div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => (task.status || "PENDING").toUpperCase() === column.id);
          return <section key={column.id} className="min-h-56 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <header className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className={`text-xs font-bold uppercase tracking-wide ${column.tone.split(" ")[0]}`}>{column.label}</h2>
              <span className="text-xs text-slate-500">{columnTasks.length}</span>
            </header>
            <div className="space-y-3">
              {columnTasks.map((task) => <article key={task.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <h3 className="text-sm font-semibold text-white">{task.title}</h3>
                {task.description && <p className="text-xs leading-5 text-slate-400">{task.description}</p>}
                <p className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{task.zone || "Zone not specified"}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400"><UserRound className="h-3 w-3" />{task.volunteerName || "Unassigned"}</p>
                <p className="text-[11px] text-slate-500">{formatDue(task.dueTime)}</p>
                <p className="font-mono text-[10px] text-slate-600">{task.id}</p>
              </article>)}
              {!columnTasks.length && <p className="py-5 text-center text-xs text-slate-600">No tasks</p>}
            </div>
          </section>;
        })}
      </section>
    </main>
  );
}
