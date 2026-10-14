"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Static-compatible canonical event portal lives at /events/portal?eventId=...
 * Legacy dynamic event portal URLs redirect there instead of showing a duplicate
 * mixed-role login page.
 */
export default function LegacyEventPortalPage() {
  const params = useParams();
  const router = useRouter();
  const rawEventId = params.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : String(rawEventId ?? "");

  useEffect(() => {
    if (eventId) {
      router.replace(`/events/portal?eventId=${encodeURIComponent(eventId)}`);
    } else {
      router.replace("/events");
    }
  }, [eventId, router]);

  return <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-sm text-slate-400">Opening event portal…</main>;
}
