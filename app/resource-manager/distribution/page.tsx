"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRScanner } from "@/components/ui/QRCard";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store";
import { resourcesApi, ApiResourceItem, ScannedResourceTeam } from "@/lib/api/resources";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  ScanLine,
} from "lucide-react";

export default function ResourceManagerDistributionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { currentEvent } = useAppStore();
  const eventId = (params.get("eventId") || currentEvent?.id || "").trim();
  const [inventory, setInventory] = useState<ApiResourceItem[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [scannedTeam, setScannedTeam] = useState<ScannedResourceTeam | null>(null);
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInventory = useCallback(async () => {
    if (!eventId) {
      setInventory([]);
      setError("No event is selected. Open resource distribution from an event-scoped Resource Manager session.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await resourcesApi.getAll(eventId);
      setInventory(rows);
      setSelectedResourceId((current) => {
        if (current && rows.some((item) => item.id === current && item.distributedQuantity < item.totalQuantity)) return current;
        return rows.find((item) => item.distributedQuantity < item.totalQuantity)?.id || "";
      });
    } catch (requestError) {
      setInventory([]);
      setError(requestError instanceof Error ? requestError.message : "Inventory could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void loadInventory(); }, [loadInventory]);

  const handleScan = useCallback(async (token: string) => {
    if (!eventId) return;
    setScannedTeam(null);
    setNotice("");
    setError("");
    try {
      const team = await resourcesApi.scanTeam(eventId, token);
      setScannedTeam(team);
      setNotice("Team verified for this event. No attendance status was changed.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The scanned code could not be verified.");
    }
  }, [eventId]);

  const selectedResource = useMemo(
    () => inventory.find((item) => item.id === selectedResourceId) || null,
    [inventory, selectedResourceId],
  );

  async function issueResource() {
    if (!scannedTeam || !selectedResource) return;
    setIssuing(true);
    setNotice("");
    setError("");
    try {
      const result = await resourcesApi.distribute(selectedResource.id, scannedTeam.teamId);
      setNotice(`Distribution recorded. Remaining quantity: ${Math.max(0, result.totalQuantity - result.distributedQuantity)} ${selectedResource.unit}.`);
      await loadInventory();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Distribution was not saved.");
    } finally {
      setIssuing(false);
    }
  }

  const available = inventory.reduce((sum, row) => sum + Math.max(0, row.totalQuantity - row.distributedQuantity), 0);
  const distributed = inventory.reduce((sum, row) => sum + row.distributedQuantity, 0);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(eventId ? `/resource-manager?eventId=${encodeURIComponent(eventId)}` : "/resource-manager")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          <div><p className="font-mono text-xs uppercase tracking-wider text-rose-300">Resource Manager</p><h1 className="mt-1 text-2xl font-bold text-white">Inventory distribution</h1><p className="mt-1 text-sm text-slate-400">Verify real event/team codes, then persist an inventory handoff.</p></div>
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void loadInventory()}>{loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh inventory</Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">Inventory items</p><p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : inventory.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">Distributed quantity</p><p className="mt-2 text-2xl font-bold text-sky-200">{loading ? "…" : distributed}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">Available quantity</p><p className="mt-2 text-2xl font-bold text-emerald-200">{loading ? "…" : available}</p></div>
      </section>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}
      {notice && <div role="status" className="flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white"><ScanLine className="h-5 w-5 text-indigo-300" /><h2 className="font-semibold">Verify team for this event</h2></div>
          <QRScanner onScanSuccess={(token) => void handleScan(token)} />
          {scannedTeam && <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-slate-900 p-5">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><h3 className="font-semibold text-white">Team verified</h3></div>
            <p className="text-lg font-semibold text-white">{scannedTeam.teamName}</p>
            <p className="text-xs font-mono text-slate-500">{scannedTeam.teamId}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Team lead</dt><dd className="mt-1 text-slate-200">{scannedTeam.leadName || "Not available"}</dd></div>
              <div><dt className="text-slate-500">Members</dt><dd className="mt-1 text-slate-200">{scannedTeam.memberCount}</dd></div>
              <div><dt className="text-slate-500">Registration</dt><dd className="mt-1 text-slate-200">{scannedTeam.registrationStatus}</dd></div>
              <div><dt className="text-slate-500">Check-in</dt><dd className="mt-1 text-slate-200">{scannedTeam.checkInStatus}</dd></div>
            </dl>
          </div>}
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-rose-300" /><h2 className="font-semibold text-white">Record inventory handoff</h2></div>
          <label className="block space-y-1.5 text-sm text-slate-300">Inventory item
            <select value={selectedResourceId} onChange={(event) => setSelectedResourceId(event.target.value)} disabled={loading || inventory.length === 0} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white">
              <option value="">Select available inventory</option>
              {inventory.filter((item) => item.distributedQuantity < item.totalQuantity).map((item) => <option key={item.id} value={item.id}>{item.itemName} · {item.totalQuantity - item.distributedQuantity} {item.unit} available</option>)}
            </select>
          </label>
          {selectedResource && <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm"><p className="font-medium text-white">{selectedResource.itemName}</p><p className="mt-1 text-slate-400">{selectedResource.category} · {selectedResource.distributedQuantity}/{selectedResource.totalQuantity} {selectedResource.unit} distributed</p></div>}
          <Button type="button" variant="primary" block disabled={!eventId || !scannedTeam || !selectedResource || issuing || selectedResource.distributedQuantity >= selectedResource.totalQuantity} isLoading={issuing} onClick={() => void issueResource()}>Record one-unit handoff</Button>
          <p className="text-xs leading-5 text-slate-500">A successful handoff is written to the backend and inventory is refreshed. Scanning alone does not change participant attendance or create a distribution record.</p>
        </section>
      </div>

      {!loading && inventory.length === 0 && !error && <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">No inventory records are configured for this event yet.</div>}
    </main>
  );
}
