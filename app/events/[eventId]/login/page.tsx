"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Canonical event-role login lives at /events/login?eventId=...
 * Keep the parameterized URL as a compatibility entry point, but do not
 * maintain a second login implementation with different role rules.
 */
export default function DedicatedEventLoginPage() {
  const params = useParams();
  const router = useRouter();
  const rawEventId = params.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : String(rawEventId ?? "");

  useEffect(() => {
    if (eventId) {
      router.replace(`/events/login?eventId=${encodeURIComponent(eventId)}`);
    } else {
      router.replace("/");
    }
  }, [eventId, router]);

  return <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-sm text-slate-400">Opening event role login…</main>;
}
