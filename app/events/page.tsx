"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { EventItem } from "@/types";
import { Calendar, Plus, Users, Building, ArrowRight, RefreshCw, AlertTriangle, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@/lib/api/events";
import { getActiveOrganizationId } from "@/lib/api/config";

type ApiFailureKind = "unauthenticated" | "forbidden" | "not-found" | "network" | "server" | "unknown";

function classifyApiFailure(error: unknown): { kind: ApiFailureKind; message: string; hint: string } {
  const message = error instanceof Error ? error.message : "Unable to load events for this workspace.";
  const status = error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;

  if (status === 401) return {
    kind: "unauthenticated",
    message: "Your admin session is missing or has expired.",
    hint: "Sign in again with your Organization Admin account, then refresh this page.",
  };
  if (status === 403) return {
    kind: "forbidden",
    message: "Your account is signed in but cannot view events in this organization.",
    hint: "Check that the active organization membership belongs to this workspace. Contact an organization owner if access should be granted.",
  };
  if (status === 404) return {
    kind: "not-found",
    message: "The events service or requested resource was not found.",
    hint: "Check the deployed API version and endpoint configuration.",
  };
  if (/could not reach the API|failed to fetch|network|cors|load failed/i.test(message)) return {
    kind: "network",
    message: "The browser could not complete its connection to the events service.",
    hint: "This may be a network, CORS, TLS, or service-connectivity issue. Retry, then inspect the browser request details if it persists.",
  };
  if (status && status >= 500) return {
    kind: "server",
    message: "The events service encountered a server error.",
    hint: "The service is responding, but could not complete this request. Retry later or report the error code to support.",
  };
  return {
    kind: "unknown",
    message,
    hint: "Retry the request. If it continues, report the message and the time it occurred.",
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "Dates not set";
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failure, setFailure] = useState<ReturnType<typeof classifyApiFailure> | null>(null);
  const [hasOrganizationContext, setHasOrganizationContext] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const loadEvents = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setFailure(null);

    try {
      const organizationId = getActiveOrganizationId();
      setHasOrganizationContext(Boolean(organizationId));
      const result = await eventsApi.getAll();
      setEvents(Array.isArray(result) ? result : []);
      setLastLoadedAt(new Date());
    } catch (error) {
      // Keep the last successful result visible during a failed manual refresh.
      // On the initial load there is no known-good data to show.
      setFailure(classifyApiFailure(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const columns: Column<EventItem>[] = [
    {
      key: "name",
      header: "Event Title & Scope",
      sortable: true,
      render: (event) => (
        <div className="min-w-48">
          <div className="font-semibold text-slate-100">{event.name || "Untitled event"}</div>
          <div className="mt-1 text-[11px] text-slate-500 line-clamp-2">{event.description || "No event description provided."}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Event Type",
      sortable: true,
      render: (event) => <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">{event.type || "Unspecified"}</span>,
    },
    { key: "status", header: "Status", sortable: true, render: (event) => <StatusBadge status={event.status || "UNKNOWN"} /> },
    {
      key: "startDate",
      header: "Event dates",
      render: (event) => <div className="min-w-36 text-xs text-slate-300">{formatDateRange(event.startDate, event.endDate)}</div>,
    },
    {
      key: "registrationDeadline",
      header: "Registration closes",
      render: (event) => (
        <div className="min-w-32 text-xs text-slate-300">
          <div className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-amber-300" />{formatDate(event.registrationDeadline)}</div>
        </div>
      ),
    },
    {
      key: "registeredTeamsCount",
      header: "Enrolled teams",
      sortable: true,
      render: (event) => <span className="whitespace-nowrap font-mono text-xs"><span className="font-bold text-indigo-400">{event.registeredTeamsCount ?? "—"}</span> / {event.expectedParticipants ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (event) => <Button size="sm" variant="outline" onClick={() => router.push(`/events/detail?eventId=${encodeURIComponent(event.id)}`)} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Open hub</Button>,
    },
  ];

  const activeCount = useMemo(() => events.filter((event) => ["LIVE", "ACTIVE", "IN_PROGRESS"].includes(String(event.status).toUpperCase())).length, [events]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-mono text-xl font-bold text-white">Managed events & programs</h2>
          <p className="text-sm text-slate-400">Events retrieved from your authorized organization workspace.</p>
          {lastLoadedAt && <p className="mt-1 text-[11px] text-slate-500">Last successful refresh: {lastLoadedAt.toLocaleTimeString()}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" disabled={isRefreshing || isLoading} onClick={() => void loadEvents(true)} leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/events/create")}>Create event</Button>
        </div>
      </div>

      {failure && (
        <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="font-semibold">{failure.message}</p>
              <p className="mt-1 text-amber-100/80">{failure.hint}</p>
              {events.length > 0 && <p className="mt-2 text-xs text-amber-100/70">Showing the last successfully loaded event list. It may be out of date.</p>}
              {failure.kind === "unauthenticated" && <Button className="mt-3" size="sm" variant="outline" onClick={() => router.push("/login")}>Go to admin sign in</Button>}
              <Button className="mt-3 ml-2" variant="outline" size="sm" disabled={isRefreshing} onClick={() => void loadEvents(true)}>Retry</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Total events" value={isLoading || (failure && events.length === 0) ? "—" : events.length} icon={<Calendar className="h-4 w-4 text-indigo-400" />} />
        <KPICard title="Active events" value={isLoading || (failure && events.length === 0) ? "—" : activeCount} accentColor="emerald" icon={<Users className="h-4 w-4 text-emerald-400" />} />
        <KPICard
          title="Organization scope"
          value={isLoading ? "Checking" : hasOrganizationContext ? "Organization" : "Account scope"}
          subtitle={isLoading ? "Verifying workspace context" : hasOrganizationContext ? "Events authorized for this organization" : "Backend determines access; no client-side scope override"}
          accentColor="sky"
          icon={<Building className="h-4 w-4 text-sky-400" />}
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Loading organization events…</div>
      ) : failure && events.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-300" />
          <h3 className="font-semibold text-white">Events could not be loaded</h3>
          <p className="mt-2 text-sm text-slate-400">The workspace is available, but the events request did not complete. Use the diagnostic message above to identify the next action.</p>
          <Button className="mt-4" variant="outline" onClick={() => void loadEvents(true)} disabled={isRefreshing}>Try again</Button>
        </div>
      ) : !failure && events.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 p-8 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <h3 className="font-semibold text-white">No events in this workspace</h3>
          <p className="mt-1 text-sm text-slate-400">There are currently no events returned for your authorized organization. Create an event when you are ready to plan one.</p>
          <Button className="mt-4" variant="primary" onClick={() => router.push("/events/create")}>Create first event</Button>
        </div>
      ) : events.length > 0 ? (
        <DataTable
          data={events}
          columns={columns}
          keyExtractor={(event) => event.id}
          searchPlaceholder="Filter by title, category or status…"
          searchFilter={(event, query) =>
            event.name.toLowerCase().includes(query) ||
            event.type.toLowerCase().includes(query) ||
            String(event.status || "").toLowerCase().includes(query) ||
            (event.description || "").toLowerCase().includes(query)
          }
          onRowClick={(event) => router.push(`/events/detail?eventId=${encodeURIComponent(event.id)}`)}
        />
      ) : null}
    </div>
  );
}
