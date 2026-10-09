"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { OrganizationSwitcher } from "@/components/ui/OrganizationSwitcher";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { authApi } from "@/lib/api/auth";
import {
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
  Megaphone,
  Bot,
  BarChart3,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  roles?: string[]; // if empty, visible to admins/coordinators
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentRole,
    theme,
    toggleTheme,
    isSidebarCollapsed,
    toggleSidebar,
    setMobileSidebarOpen,
    currentUser,
    logout,
  } = useAppStore();

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push("/login");
  };

  // Role-based Nav items
  let navItems: NavItem[] = [];

  if (currentRole === "SUPER_ADMIN") {
    navItems = [
      { label: "Super Admin Dashboard", href: "/super-admin", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Organizations", href: "/super-admin/organizations", icon: <Building className="w-4 h-4" />, badge: "Multi-tenant" },
      { label: "Users & Accounts", href: "/super-admin/users", icon: <Users className="w-4 h-4" /> },
      { label: "Platform Admins", href: "/super-admin/admins", icon: <ShieldCheck className="w-4 h-4" /> },
      { label: "Platform Analytics", href: "/super-admin/analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "System Settings", href: "/super-admin/settings", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (currentRole === "JUDGE") {
    navItems = [
      { label: "Judge Dashboard", href: "/judge", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "My Assigned Teams", href: "/judge/teams", icon: <Users className="w-4 h-4" />, badge: "Active" },
      { label: "Evaluation Rubric", href: "/judge/evaluation/T042", icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: "Evaluation History", href: "/judge/history", icon: <Scale className="w-4 h-4" /> },
      { label: "Scan Team QR", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
      { label: "My Profile", href: "/settings/profile", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (currentRole === "VOLUNTEER") {
    navItems = [
      { label: "Volunteer Dashboard", href: "/volunteers", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "My Tasks", href: "/volunteers/tasks", icon: <ClipboardCheck className="w-4 h-4" />, badge: "5 Tasks" },
      { label: "My Shifts", href: "/volunteers/shifts", icon: <Clock className="w-4 h-4" /> },
      { label: "QR Check-in Scanner", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
      { label: "Report Incident", href: "/incidents", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Announcements", href: "/communication", icon: <Megaphone className="w-4 h-4" /> },
      { label: "Profile", href: "/settings/profile", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (currentRole === "PARTICIPANT") {
    navItems = [
      { label: "Home", href: "/participant", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "My Team", href: "/participant/team", icon: <Users className="w-4 h-4" /> },
      { label: "My Project", href: "/participant/project", icon: <Sparkles className="w-4 h-4" /> },
      { label: "Event Schedule", href: "/participant/schedule", icon: <Calendar className="w-4 h-4" /> },
      { label: "My QR Pass", href: "/participant/qr", icon: <QrCode className="w-4 h-4" />, badge: "Badge" },
      { label: "Attendance Status", href: "/participant/attendance", icon: <ShieldCheck className="w-4 h-4" /> },
      { label: "My Allocation", href: "/participant/allocation", icon: <Building className="w-4 h-4" /> },
      { label: "Announcements", href: "/participant/announcements", icon: <Megaphone className="w-4 h-4" /> },
      { label: "Leaderboard & Results", href: "/participant/results", icon: <Trophy className="w-4 h-4" /> },
      { label: "My Profile", href: "/participant/profile", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (currentRole === "TECHNICAL_STAFF") {
    navItems = [
      { label: "Technical Dashboard", href: "/technical-staff", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Assigned Rooms", href: "/technical-staff/rooms", icon: <Building className="w-4 h-4" /> },
      { label: "Equipment Inventory", href: "/technical-staff/equipment", icon: <Box className="w-4 h-4" /> },
      { label: "Technical Tasks", href: "/technical-staff/tasks", icon: <ClipboardCheck className="w-4 h-4" />, badge: "Active" },
      { label: "QR Equipment Scanner", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
      { label: "Technical Incidents", href: "/incidents", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Announcements", href: "/communication", icon: <Megaphone className="w-4 h-4" /> },
      { label: "Profile", href: "/settings/profile", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (currentRole === "RESOURCE_MANAGER") {
    navItems = [
      { label: "Resource Dashboard", href: "/resource-manager", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Food & Catering", href: "/resources/food", icon: <Box className="w-4 h-4" /> },
      { label: "Meal Distribution", href: "/resource-manager/meals", icon: <HeartHandshake className="w-4 h-4" /> },
      { label: "Badges & Kits", href: "/resource-manager/badges", icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: "Certificates", href: "/resource-manager/certificates", icon: <Trophy className="w-4 h-4" /> },
      { label: "Inventory Management", href: "/resources/inventory", icon: <Box className="w-4 h-4" /> },
      { label: "Distribution Scanner", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
      { label: "Profile", href: "/settings/profile", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (currentRole === "COORDINATOR") {
    navItems = [
      { label: "Operations Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Control Center", href: "/control-center", icon: <Radio className="w-4 h-4" />, badge: "LIVE" },
      { label: "Teams", href: "/teams", icon: <Users className="w-4 h-4" />, badge: "120" },
      { label: "QR Check-in Scanner", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
      { label: "Attendance Registry", href: "/attendance/teams", icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: "Venues & Benches", href: "/venues", icon: <Building className="w-4 h-4" /> },
      { label: "Judges Roster", href: "/judges", icon: <Scale className="w-4 h-4" /> },
      { label: "Allocation Matrix", href: "/allocation/results", icon: <Cpu className="w-4 h-4" /> },
      { label: "Evaluations", href: "/judge/teams", icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: "Rounds & Leaderboard", href: "/rounds", icon: <Trophy className="w-4 h-4" /> },
      { label: "Volunteers", href: "/volunteers", icon: <HeartHandshake className="w-4 h-4" /> },
      { label: "Resources", href: "/resources", icon: <Box className="w-4 h-4" /> },
      { label: "Incidents", href: "/incidents", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Communication", href: "/communication", icon: <Megaphone className="w-4 h-4" /> },
      { label: "AI Assistant", href: "/ai-assistant", icon: <Bot className="w-4 h-4" />, badge: "Copilot" },
    ];
  } else if (currentRole === "EVENT_ADMIN") {
    navItems = [
      { label: "Event Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Control Center", href: "/control-center", icon: <Radio className="w-4 h-4" />, badge: "LIVE" },
      { label: "Teams / Participants", href: "/teams", icon: <Users className="w-4 h-4" />, badge: "120" },
      { label: "Participant QR Details", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
      { label: "Venues & Benches", href: "/venues", icon: <Building className="w-4 h-4" /> },
      { label: "Judges / Evaluators", href: "/judges", icon: <Scale className="w-4 h-4" /> },
      { label: "Intelligent Allocation", href: "/allocation/optimization", icon: <Cpu className="w-4 h-4" />, badge: "OR-Tools" },
      { label: "Evaluations Oversight", href: "/judge/teams", icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: "Rounds & Progression", href: "/rounds", icon: <Trophy className="w-4 h-4" /> },
      { label: "Volunteers", href: "/volunteers", icon: <HeartHandshake className="w-4 h-4" /> },
      { label: "Resources & Food", href: "/resources", icon: <Box className="w-4 h-4" /> },
      { label: "Incidents Escalation", href: "/incidents", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Communication", href: "/communication", icon: <Megaphone className="w-4 h-4" /> },
      { label: "Analytics & Reports", href: "/analytics/attendance", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Event Settings", href: "/events/evt-01/settings", icon: <Settings className="w-4 h-4" /> },
    ];
  } else {
    // ORGANIZATION_ADMIN
    navItems = [
      { label: "Executive Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Control Center", href: "/control-center", icon: <Radio className="w-4 h-4" />, badge: "LIVE" },
      { label: "Events Management", href: "/events", icon: <Calendar className="w-4 h-4" /> },
      { label: "Teams / Participants", href: "/teams", icon: <Users className="w-4 h-4" />, badge: "120" },
      { label: "QR Attendance", href: "/attendance/scanner", icon: <QrCode className="w-4 h-4" /> },
      { label: "Venues & Benches", href: "/venues", icon: <Building className="w-4 h-4" /> },
      { label: "Judges & Juries", href: "/judges", icon: <Scale className="w-4 h-4" /> },
      { label: "Intelligent Allocation", href: "/allocation/optimization", icon: <Cpu className="w-4 h-4" />, badge: "OR-Tools" },
      { label: "Evaluations", href: "/judge/teams", icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: "Rounds & Leaderboard", href: "/rounds", icon: <Trophy className="w-4 h-4" /> },
      { label: "Volunteers", href: "/volunteers", icon: <HeartHandshake className="w-4 h-4" /> },
      { label: "Resources & Assets", href: "/resources", icon: <Box className="w-4 h-4" /> },
      { label: "Incidents", href: "/incidents", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Communication", href: "/communication", icon: <Megaphone className="w-4 h-4" /> },
      { label: "AI Assistant", href: "/ai-assistant", icon: <Bot className="w-4 h-4" />, badge: "Copilot" },
      { label: "Analytics & Reports", href: "/analytics/attendance", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Organization Settings", href: "/settings/organization", icon: <Settings className="w-4 h-4" /> },
    ];
  }

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col border-r border-slate-800 bg-slate-950 text-slate-300 transition-all duration-300 z-30 select-none",
        isSidebarCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link
          href="/dashboard"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold shrink-0">
            EO
          </div>
          {!isSidebarCollapsed && (
            <div className="truncate">
              <span className="font-extrabold tracking-wider text-sm text-white font-mono block">
                EVENTOPS
              </span>
              <span className="text-[9px] text-slate-400 font-mono tracking-tight block">
                RUN THE EVENT, NOT THE PAPERWORK.
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Switchers (Organization & Role) */}
      {!isSidebarCollapsed && (
        <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-950/60">
          <OrganizationSwitcher />
          <RoleSwitcher />
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative",
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                )}
              >
                {item.icon}
              </span>

              {!isSidebarCollapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-mono tracking-tight",
                        item.badge === "LIVE"
                          ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30"
                          : item.badge === "OR-Tools"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition text-xs cursor-pointer"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            {!isSidebarCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </div>

        {/* Prominent Sidebar Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer group",
            isSidebarCollapsed && "justify-center"
          )}
          title="Sign out of EventOps"
        >
          <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
          {!isSidebarCollapsed && <span>Sign Out</span>}
        </button>

        {!isSidebarCollapsed && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="truncate">
              <p className="font-semibold text-slate-200 truncate">{currentUser?.name?.split(" ")[0] || "Guest"}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || "No user active"}</p>
            </div>
            <span className="font-mono text-[9px] text-indigo-400">v2.4 Pro</span>
          </div>
        )}
      </div>
    </aside>
  );
};
