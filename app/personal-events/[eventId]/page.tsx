"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export default function PersonalEventRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { selectPersonalEventWorkspace } = useAppStore();

  useEffect(() => {
    if (params?.eventId) {
      selectPersonalEventWorkspace(params.eventId as string);
      router.replace(`/events/${params.eventId}`);
    }
  }, [params, router, selectPersonalEventWorkspace]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-mono text-xs">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Personal Event Workspace...</span>
      </div>
    </div>
  );
}
