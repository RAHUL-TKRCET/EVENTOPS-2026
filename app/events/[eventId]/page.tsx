"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Compatibility entry point for legacy /events/:eventId links.
 *
 * GitHub Pages is statically exported, so the durable URL is
 * /events/detail?eventId=...; the not-found route also redirects legacy
 * direct URLs on hosts that route them through the application shell.
 * Protected data is fetched only by the canonical API-backed detail page.
 */
export default function EventDetailCompatibilityRoute() {
  const params = useParams();
  const router = useRouter();
  const rawEventId = params.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : String(rawEventId ?? "");

  useEffect(() => {
    if (!eventId) {
      router.replace("/events");
      return;
    }
    router.replace(`/events/detail?eventId=${encodeURIComponent(eventId)}`);
  }, [eventId, router]);

  return (
    <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">
      Opening the selected event…
    </div>
  );
}
