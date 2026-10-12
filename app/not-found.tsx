"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const normalizedBase = basePath.replace(/\/$/, "");
    const relativePath = normalizedBase && pathname.startsWith(normalizedBase)
      ? pathname.slice(normalizedBase.length)
      : pathname;

    // GitHub Pages cannot generate paths for arbitrary event IDs created after
    // deployment. Translate legacy links to static-compatible query routes.
    // This is navigation compatibility only: the FastAPI API still authorizes
    // every protected request using the verified token and persisted membership.
    const match = relativePath.match(/^\/events\/([^/]+)(?:\/(portal|login|roles|rounds|timeslots|criteria|rules|settings))?\/?$/);
    if (!match) return;

    const eventId = safeDecode(match[1]);
    const subroute = match[2];
    const fixedRoutes = new Set(["detail", "portal", "login", "create"]);
    if (!subroute && fixedRoutes.has(eventId)) return;

    const encodedEventId = encodeURIComponent(eventId);
    let destination = `/events/detail?eventId=${encodedEventId}`;
    if (subroute === "portal") destination = `/events/portal?eventId=${encodedEventId}`;
    if (subroute === "login") destination = `/events/login?eventId=${encodedEventId}`;
    if (subroute === "roles") destination = `/people?eventId=${encodedEventId}`;
    if (subroute && ["rounds", "timeslots", "criteria", "rules", "settings"].includes(subroute)) {
      destination += `&section=${subroute}`;
    }
    router.replace(destination);
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3">
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-slate-400">The page may have moved. Older event links are redirected to the static-compatible event routes when possible.</p>
        <a href="/EVENTOPS-2026/events" className="text-sm text-indigo-300 underline">Back to Events</a>
      </div>
    </main>
  );
}
