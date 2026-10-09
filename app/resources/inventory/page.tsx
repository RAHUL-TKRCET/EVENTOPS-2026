"use client";

import React from "react";
import { ArrowLeft, Box, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function InventoryManagementPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/resources"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Central Warehouse & Inventory</h2>
          <p className="text-xs text-slate-400">Total logistical reserves across facilities.</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>Warehouse Central Audit in Good Standing</span>
        </div>
        <p className="text-slate-400">
          All physical inventories are cross-reconciled against RFID tracking gates at Entry Points North and South.
        </p>
      </div>
    </div>
  );
}
