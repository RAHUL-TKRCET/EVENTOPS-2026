"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { resourcesApi, ApiResourceItem } from "@/lib/api/resources";
import {
  AlertCircle,
  ArrowRight,
  Box,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Utensils,
} from "lucide-react";

export default function ResourceManagerDashboardPage() {
  const params = useSearchParams();
  const { currentEvent } = useAppStore();
  const eventId = (params.get("eventId") || currentEvent?.id || "").trim();
  const [items, setItems] = useState<ApiResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!eventId) {
      setItems([]);
      setError("No event is selected. Sign in through the event-specific login link to access inventory.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setItems(await resourcesApi.getAll(eventId));
    } catch (requestError) {
      setItems([]);
      setError(requestError instanceof Error ? requestError.message : "Inventory could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.totalQuantity, 0), [items]);
  const distributedQuantity = useMemo(() => items.reduce((sum, item) => sum + item.distributedQuantity, 0), [items]);
  const remainingQuantity = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, item.totalQuantity - item.distributedQuantity), 0), [items]);
  const lowStockCount = useMemo(() => items.filter((item) => item.totalQuantity > 0 && item.totalQuantity - item.distributedQuantity <= Math.max(1, Math.floor(item.totalQuantity * 0.1))).length, [items]);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-rose-500/20 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">Resource Manager</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{currentEvent?.name || "Event inventory"}</h1>
          <p className="mt-2 text-sm text-slate-400">Counts come from persisted event inventory. No sample totals are shown.</p>
          {eventId && <p className="mt-1 font-mono text-xs text-slate-600">Event ID: {eventId}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => void load()}>{loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button>
          <Link href={eventId ? `/resource-manager/distribution?eventId=${encodeURIComponent(eventId)}` : "/resource-manager/distribution"} className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500">Open distribution <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
      </header>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Box className="h-4 w-4" />Inventory records</div><p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : items.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><PackageCheck className="h-4 w-4" />Total quantity</div><p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : totalQuantity}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Utensils className="h-4 w-4" />Distributed quantity</div><p className="mt-2 text-2xl font-bold text-sky-200">{loading ? "…" : distributedQuantity}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">Available / low stock</p><p className="mt-2 text-2xl font-bold text-emerald-200">{loading ? "…" : remainingQuantity}</p><p className="mt-1 text-xs text-amber-300">{loading ? "Calculating…" : `${lowStockCount} low-stock item(s)`}</p></div>
      </section>

      {loading && <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin" />Loading inventory…</div>}
      {!loading && !error && items.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"><Box className="mx-auto h-8 w-8 text-rose-300" /><h2 className="mt-3 font-semibold text-white">No inventory configured</h2><p className="mt-2 text-sm text-slate-400">The selected event has no inventory records yet.</p></div>}

      <section className="space-y-3">
        {items.map((item) => {
          const remaining = Math.max(0, item.totalQuantity - item.distributedQuantity);
          const status = remaining === 0 ? "DEPLETED" : remaining <= Math.max(1, Math.floor(item.totalQuantity * 0.1)) ? "LOW STOCK" : "IN STOCK";
          return <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{item.itemName}</h2><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${remaining === 0 ? "border-rose-500/30 text-rose-300" : status === "LOW STOCK" ? "border-amber-500/30 text-amber-300" : "border-emerald-500/30 text-emerald-300"}`}>{status}</span></div><p className="mt-1 text-sm text-slate-400">{item.category} · {item.id}</p></div>
            <div className="text-left sm:text-right"><p className="text-lg font-semibold text-white">{remaining} / {item.totalQuantity} <span className="text-sm font-normal text-slate-400">{item.unit} remaining</span></p><p className="mt-1 text-xs text-slate-500">{item.distributedQuantity} distributed</p></div>
          </article>;
        })}
      </section>
    </main>
  );
}
