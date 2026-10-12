"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    // Compatibility for saved /events/<id> links from before GitHub Pages static
    // routes were introduced. This only rewrites the URL; API authorization still
    // checks the verified token and organization membership.
    const match = relativePath.match(/^\/events\/([^/]+)\/?$/);
    if (match && match[1] !== "detail" && match[1] !== "portal" && match[1] !== "login" && match[1] !== "create") {
      router.replace(`/events/detail?eventId=${encodeURIComponent(decodeURIComponent(match[1]))}`);
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3">
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-slate-400">The page may have moved. If you opened an older event link, it will redirect to the static-compatible event route when possible.</p>
        <a href="/EVENTOPS-2026/events" className="text-sm text-indigo-300 underline">Back to Events</a>
      </div>
    </main>
  );
}
