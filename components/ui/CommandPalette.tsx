"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  Building,
  Scale,
  Cpu,
  Radio,
  ClipboardCheck,
  Trophy,
  HeartHandshake,
  Box,
  AlertTriangle,
  Bot,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  href: string;
  icon: React.ReactNode;
}

const commands: CommandItem[] = [
  { id: "dash", label: "Operations Dashboard", category: "Core Ops", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "cc", label: "Live Control Center (ECC)", category: "Core Ops", href: "/control-center", icon: <Radio className="w-4 h-4" /> },
  { id: "alloc", label: "Intelligent Allocation (OR-Tools)", category: "Core Ops", href: "/allocation/optimization", icon: <Cpu className="w-4 h-4" /> },
  { id: "qr", label: "QR Attendance Scanner", category: "Field Ops", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
  { id: "teams", label: "Registered Teams (120)", category: "Participants", href: "/teams", icon: <Users className="w-4 h-4" /> },
  { id: "venues", label: "Venues & Bench Map", category: "Facilities", href: "/venues", icon: <Building className="w-4 h-4" /> },
  { id: "judges", label: "Judges & Workload Matrix", category: "Jury", href: "/judges", icon: <Scale className="w-4 h-4" /> },
  { id: "eval", label: "Judge Evaluation & Scoring", category: "Jury", href: "/judge/teams", icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "rounds", label: "Round Progression & Rankings", category: "Competitions", href: "/rounds", icon: <Trophy className="w-4 h-4" /> },
  { id: "volunteers", label: "Volunteer Task Roster", category: "Staff", href: "/volunteers/tasks", icon: <HeartHandshake className="w-4 h-4" /> },
  { id: "resources", label: "Food & Hardware Depots", category: "Logistics", href: "/resources/food", icon: <Box className="w-4 h-4" /> },
  { id: "incidents", label: "Incident Escalation Board", category: "Support", href: "/incidents", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "ai", label: "AI Operations Copilot", category: "Intelligence", href: "/ai-assistant", icon: <Bot className="w-4 h-4" /> },
  { id: "settings", label: "System & RBAC Settings", category: "Admin", href: "/settings/roles", icon: <Settings className="w-4 h-4" /> },
];

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase().trim()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-2.5" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or jump to screen... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500 font-mono">
              No matching operations found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCommandPaletteOpen(false);
                  router.push(item.href);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs hover:bg-slate-800/80 text-slate-200 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                    {item.icon}
                  </span>
                  <span className="font-medium group-hover:text-white">{item.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>EVENTOPS Universal Ops Command</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
