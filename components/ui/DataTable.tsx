"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search as SearchIcon } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  emptyMessage?: string;
  headerActions?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Search records...",
  searchFilter,
  onRowClick,
  pageSize = 10,
  emptyMessage = "No records found matching criteria.",
  headerActions,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let result = data;
    if (searchQuery.trim() && searchFilter) {
      result = result.filter((item) => searchFilter(item, searchQuery.toLowerCase().trim()));
    }
    if (sortKey) {
      result = [...result].sort((a: any, b: any) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        return sortOrder === "asc" ? 1 : -1;
      });
    }
    return result;
  }, [data, searchQuery, searchFilter, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortKey(null);
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {searchFilter ? (
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        ) : (
          <div />
        )}
        {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      "px-4 py-3",
                      col.sortable && "cursor-pointer select-none hover:text-white transition",
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0 text-slate-500">
                          {sortKey === col.key ? (
                            sortOrder === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      "hover:bg-slate-800/40 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3 align-middle", col.className)}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-200">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-200">
                {Math.min(currentPage * pageSize, filteredData.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-200">{filteredData.length}</span>{" "}
              entries
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-2 py-1 font-mono text-[11px] text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
