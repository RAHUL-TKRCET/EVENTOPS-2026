"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Database, RefreshCw, ShieldCheck, AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiRequest } from "@/lib/api/config";

export default function DatabaseCatalogPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<string[]>("/database/tables");
      setTables(result);
    } catch (requestError) {
      setTables([]);
      setError(requestError instanceof Error ? requestError.message : "Database catalog could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTables(); }, [loadTables]);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900 to-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-300">Platform Governance</p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-white"><Database className="h-6 w-6" />Database Catalog</h1>
          <p className="mt-2 text-sm text-slate-400">Names are loaded from the authenticated backend. This view does not expose table rows or execute ad-hoc SQL.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadTables()} disabled={loading}>
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh catalog
        </Button>
      </header>

      <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
        <p>Database catalog access is restricted to a global Super Admin session. Event and organization operations should use the application’s event-scoped APIs.</p>
      </div>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}
      {loading && <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin" />Loading table catalog…</div>}

      {!loading && !error && tables.length === 0 && <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">The backend returned no public table names.</div>}
      {!loading && !error && tables.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Public table names</h2><span className="text-xs text-slate-500">{tables.length} table(s)</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((tableName) => (
              <article key={tableName} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <Database className="h-4 w-4 shrink-0 text-indigo-300" />
                <code className="break-all text-sm text-slate-200">{tableName}</code>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
