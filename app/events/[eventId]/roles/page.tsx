"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle, Users } from "lucide-react";

export default function EventRolesRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  useEffect(() => {
    if (eventId) {
      router.replace(`/people?eventId=${encodeURIComponent(eventId)}`);
    }
  }, [eventId, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-300">
      <LoaderCircle className="h-6 w-6 animate-spin text-indigo-300" />
      <Users className="h-6 w-6 text-indigo-300" />
      <p className="text-sm">Opening the secured People & Roles workspace…</p>
    </div>
  );
}
