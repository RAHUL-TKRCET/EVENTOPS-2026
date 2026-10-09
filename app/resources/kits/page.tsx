"use client";

import React from "react";
import { ArrowLeft, Box, Check } from "lucide-react";
import Link from "next/link";

export default function KitsManagementPage() {
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
          <h2 className="text-xl font-bold font-mono text-white">Participant Welcome Kits & Swag</h2>
          <p className="text-xs text-slate-400">Kit fulfillment tracking at main gate check-in.</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 text-xs">
        <div className="flex justify-between items-center text-slate-200">
          <span className="font-semibold">Hacker Welcome Swag Kits</span>
          <span className="font-mono text-emerald-400 font-bold">480 / 500 Distributed (96%)</span>
        </div>
        <p className="text-slate-400">
          Contains official EventOps NFC badge, hackathon hoodie, lanyard, and hardware vouchers.
        </p>
      </div>
    </div>
  );
}
