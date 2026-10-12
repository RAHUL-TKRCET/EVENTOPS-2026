"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EventRulesCompatibilityRoute() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.eventId;
  const eventId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? "");

  useEffect(() => {
    if (!eventId) {
      router.replace("/events");
      return;
    }
    router.replace(`/events/detail?eventId=${encodeURIComponent(eventId)}&section=rules`);
  }, [eventId, router]);

  return <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Opening configured event rules…</div>;
}
