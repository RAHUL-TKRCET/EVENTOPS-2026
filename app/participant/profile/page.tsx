"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ParticipantProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <p role="status" className="text-sm text-slate-400">Opening your shared profile settings…</p>
    </main>
  );
}
