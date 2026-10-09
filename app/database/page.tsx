"use client";

import React, { useEffect, useState } from "react";
import { Database, Search, RefreshCw, HardDrive, ShieldCheck, Table, FileText, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TableInfo {
  table_name: string;
}

export default function DatabaseExplorerPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("users");
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    setIsLoadingTables(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/v1/database/tables");
      if (!res.ok) throw new Error("Could not reach backend PostgreSQL endpoint on port 5000");
      const data: TableInfo[] = await res.json();
      const list = data.map((t) => t.table_name);
      setTables(list);
      if (list.includes("users")) {
        setSelectedTable("users");
      } else if (list.length > 0) {
        setSelectedTable(list[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load database tables.");
    } finally {
      setIsLoadingTables(false);
    }
  };

  const fetchTableData = async (table: string) => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/database/tables/${table}`);
      if (!res.ok) throw new Error(`Could not fetch data for table: ${table}`);
      const json = await res.json();
      const rows = json.rows || [];
      setTableData(rows);
      setRowCount(json.count || rows.length);
      if (rows.length > 0) {
        setColumns(Object.keys(rows[0]));
      } else {
        setColumns([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const filteredRows = tableData.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some((val) =>
      String(val || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 border border-sky-500/20 text-sky-300 font-semibold uppercase tracking-wider">
              PostgreSQL 16 Engine
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Persistent Storage
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-400" />
            Database Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Directly inspect and verify relational records persisted on disk at <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded">backend/data/postgres/</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchTables();
              if (selectedTable) fetchTableData(selectedTable);
            }}
            isLoading={isLoadingData || isLoadingTables}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Database
          </Button>
        </div>
      </div>

      {/* Database Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DATABASE ENGINE</span>
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-lg font-bold text-white font-mono">PostgreSQL 16</p>
          <p className="text-[11px] text-slate-400">Embedded native cluster instance</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>RELATIONAL TABLES</span>
            <Table className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-white font-mono">{tables.length} Active Tables</p>
          <p className="text-[11px] text-slate-400">Full schema with constraints & indexes</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>CURRENT TABLE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-white font-mono truncate">{selectedTable}</p>
          <p className="text-[11px] text-slate-400">{rowCount} total rows stored</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-800/50 bg-rose-950/30 text-rose-300 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Main Table Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Table Selector Sidebar */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Tables ({tables.length})
            </h3>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {tables.map((tbl) => (
              <button
                key={tbl}
                onClick={() => setSelectedTable(tbl)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition text-left cursor-pointer ${
                  selectedTable === tbl
                    ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Table className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{tbl}</span>
                </div>
                {tbl === "users" && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                    Accounts
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table Data View */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg space-y-4 lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                table: <span className="text-indigo-400">{selectedTable}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Displaying {filteredRows.length} of {rowCount} rows
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search rows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            {isLoadingData ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                Loading records from PostgreSQL...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                No records found in table `{selectedTable}`.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                    {columns.map((col) => (
                      <th key={col} className="p-3 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <span>{col}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-900/50 transition text-slate-300"
                    >
                      {columns.map((col) => {
                        const val = row[col];
                        const isUserRole = col === "role";
                        const isEmail = col === "email";
                        const isPassword = col === "password_hash";

                        return (
                          <td key={col} className="p-3 whitespace-nowrap text-[11px]">
                            {isPassword ? (
                              <span className="text-slate-600 truncate max-w-[120px] inline-block">
                                •••••••••••• (bcrypt hash)
                              </span>
                            ) : isUserRole ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 border border-sky-500/20 text-sky-400">
                                {String(val)}
                              </span>
                            ) : isEmail ? (
                              <span className="text-indigo-300 font-medium">
                                {String(val)}
                              </span>
                            ) : val === null || val === undefined ? (
                              <span className="text-slate-600 italic">null</span>
                            ) : typeof val === "object" ? (
                              <span className="text-amber-400 truncate max-w-[200px] inline-block">
                                {JSON.stringify(val)}
                              </span>
                            ) : (
                              <span>{String(val)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

