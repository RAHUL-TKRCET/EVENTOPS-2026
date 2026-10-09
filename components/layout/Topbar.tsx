"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ShieldCheck,
  Radio,
  Check,
  ChevronRight,
  Sparkles,
  LogOut,
  User,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { mockAnnouncements } from "@/lib/mock-data/notifications";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

export const Topbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentEvent,
    currentRole,
    currentUser,
    workspaceMode,
    currentOrganization,
    setCommandPaletteOpen,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    activeNotificationCount,
    decrementNotificationCount,
    logout,
  } = useAppStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push("/login");
  };

  // Compute breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageTitle = pathSegments.length > 0
    ? pathSegments[pathSegments.length - 1].replace(/-/g, " ").toUpperCase()
    : "DASHBOARD";

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            {workspaceMode === "PERSONAL" ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PERSONAL EVENT
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate max-w-[120px] sm:max-w-none">
                {currentOrganization?.name || "TKR College"}
              </span>
            )}
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="truncate max-w-[140px] sm:max-w-none">{currentEvent?.name || "VISTRA Hackathon 2026"}</span>
            <ChevronRight className="w-3 h-3 text-slate-600 hidden sm:inline" />
            <span className="text-slate-300 capitalize hidden sm:inline">{pathSegments[0] || "Overview"}</span>
            {pathSegments.length > 1 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600 hidden md:inline" />
                <span className="text-indigo-400 font-semibold hidden md:inline">{pageTitle}</span>
              </>
            )}
          </div>
          <h1 className="text-sm md:text-base font-bold text-slate-100 font-mono tracking-tight hidden sm:block">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Live EventOps Heartbeat Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Realtime Ops Online</span>
        </div>

        {/* Global Search Bar (Trigger Cmd+K) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search operations...</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* AI Copilot Quick Jump */}
        <button
          onClick={() => router.push("/ai-assistant")}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-xs text-indigo-300 font-medium transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Copilot</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {activeNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-100">Live Announcements</span>
                  <span className="text-[10px] font-mono text-indigo-400">
                    {mockAnnouncements.length} broadcasts
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {mockAnnouncements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{ann.title}</span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {ann.targetAudience}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{ann.message}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    decrementNotificationCount();
                    setIsNotifOpen(false);
                    router.push("/communication/history");
                  }}
                  className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 pt-1 font-medium block"
                >
                  View Broadcast History →
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile & Menu */}
        <div className="relative flex items-center gap-2 pl-2 border-l border-slate-800">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900 transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300">
              {currentUser?.name?.split(" ").map((n) => n[0]).join("") || "AD"}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-200 truncate max-w-[120px]">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 font-mono capitalize">{currentRole.toLowerCase().replace(/_/g, " ")}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="p-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.email}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {currentRole}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/workspace");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
                >
                  <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  <span>Switch Workspace</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    const profilePath = currentRole === "PARTICIPANT" ? "/participant/profile" : "/settings/profile";
                    router.push(profilePath);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile Settings</span>
                </button>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer text-left font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dedicated Direct Log Out Button */}
        <button
          onClick={handleLogout}
          title="Sign out of EventOps"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-300 font-medium transition cursor-pointer shadow-sm shadow-rose-500/5 group"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
};
