"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { mockAnnouncements } from "@/lib/mock-data/notifications";
import { Announcement } from "@/types";
import { Megaphone, Plus, Mail, MessageSquare, Send, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CommunicationOverviewPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);

  const columns: Column<Announcement>[] = [
    {
      key: "title",
      header: "Announcement Title",
      sortable: true,
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-100">{a.title}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{a.message}</div>
        </div>
      ),
    },
    {
      key: "targetAudience",
      header: "Target Cohort",
      sortable: true,
      render: (a) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {a.targetAudience}
        </span>
      ),
    },
    {
      key: "channels",
      header: "Channels Dispatched",
      render: (a) => (
        <div className="flex gap-1">
          {a.channels.map((ch) => (
            <span key={ch} className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
              {ch}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "recipientCount",
      header: "Delivered To",
      sortable: true,
      render: (a) => <span className="font-mono text-xs">{a.recipientCount} Recipients</span>,
    },
    {
      key: "sentAt",
      header: "Broadcast Time",
      render: (a) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(a.sentAt).toLocaleTimeString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Broadcast & Multi-Channel Communications</h2>
          <p className="text-xs text-slate-400">
            Real-time push notifications, urgent SMS, WhatsApp blasts, and email bulletins.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push("/communication/create")}
        >
          Compose Broadcast
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Broadcasts" value={announcements.length} subtitle="3 Dispatched Today" icon={<Megaphone className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Total Reached" value="990 Recipients" subtitle="99.4% Delivery SLA" accentColor="emerald" icon={<Send className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Active Channels" value="In-App, SMS, Email" subtitle="WhatsApp Webhook Ready" accentColor="sky" icon={<MessageSquare className="w-4 h-4 text-sky-400" />} />
      </div>

      <DataTable
        data={announcements}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search broadcasts..."
      />
    </div>
  );
}
