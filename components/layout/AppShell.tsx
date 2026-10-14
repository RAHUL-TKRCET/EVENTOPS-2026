"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useAppStore } from "@/store";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Lock } from "lucide-react";

import { checkRouteAccess, getRoleHomeRoute } from "@/lib/permissions";
import { authApi } from "@/lib/api/auth";
import { eventsApi } from "@/lib/api/events";
import { AccessDenied } from "@/components/ui/AccessDenied";

const ORGANIZATION_MANAGEMENT_PREFIXES = [
  "/dashboard",
  "/events",
  "/judges",
  "/settings/organization",
  "/settings/roles",
] as const;

function isOrganizationManagementRoute(pathname: string): boolean {
  // Keep event-specific login and portals on their separate role-scoped shell.
  if (pathname.includes("/portal") || pathname.endsWith("/login")) return false;
  return ORGANIZATION_MANAGEMENT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileSidebarOpen, setMobileSidebarOpen, theme, currentRole, currentUser, currentEvent, setCurrentUser, setCurrentEvent, logout } = useAppStore();
  const [sessionResolved, setSessionResolved] = useState(false);
  const [eventContextResolved, setEventContextResolved] = useState(false);
  const effectiveRole = currentUser?.role || currentRole;
  const eventContextAttempted = useRef<string | null>(null);
  // Hide event-operations chrome only on the Organization Admin landing page.
  const isOrganizationHome = effectiveRole === "ORGANIZATION_ADMIN" && pathname === "/dashboard";

  // Public pages that do not require an active session
  const isPublicPage =
    pathname === "/" ||
    ["/login", "/register", "/forgot-password", "/reset-password", "/verify-otp", "/events/register", "/events/registration-status", "/events/portal", "/events/login", "/invitations/accept"].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    /^\/events\/[^/]+\/(portal|login)$/.test(pathname);

  // Zustand starts empty on a hard refresh. Rehydrate only from a persisted
  // token validated by the backend; never recreate identity from demo data.
  useEffect(() => {
    let active = true;
    if (currentUser) {
      setSessionResolved(true);
      return () => { active = false; };
    }
    let hasToken = false;
    try {
      hasToken = Boolean(localStorage.getItem("eventops_token") || sessionStorage.getItem("eventops_token"));
    } catch {
      hasToken = false;
    }
    if (!hasToken) {
      setSessionResolved(true);
      return () => { active = false; };
    }
    setSessionResolved(false);
    authApi.getMe()
      .then((user) => { if (active) setCurrentUser(user); })
      .catch(() => {
        if (active) {
          void authApi.logout();
          logout();
        }
      })
      .finally(() => { if (active) setSessionResolved(true); });
    return () => { active = false; };
  }, [currentUser, setCurrentUser, logout]);

  // Event ID in storage is navigation context only; API authorization still
  // comes from the validated token and backend assignment checks.
  useEffect(() => {
    let active = true;
    if (!sessionResolved) return () => { active = false; };
    const eventScopedRoles = new Set(["EVENT_ADMIN", "COORDINATOR", "JUDGE", "VOLUNTEER", "PARTICIPANT", "TECHNICAL_STAFF", "RESOURCE_MANAGER"]);
    if (!currentUser || !eventScopedRoles.has(effectiveRole)) {
      setEventContextResolved(true);
      return () => { active = false; };
    }
    let eventId: string | null = null;
    try {
      eventId = localStorage.getItem("eventops_event_id");
    } catch {
      eventId = null;
    }
    if (!eventId) {
      setEventContextResolved(true);
      return () => { active = false; };
    }
    if (currentEvent?.id === eventId) {
      setEventContextResolved(true);
      return () => { active = false; };
    }
    if (eventContextAttempted.current === eventId) {
      setEventContextResolved(true);
      return () => { active = false; };
    }
    eventContextAttempted.current = eventId;
    setEventContextResolved(false);
    eventsApi.getPublicById(eventId)
      .then((event) => { if (active) setCurrentEvent(event); })
      .catch(() => { if (active) setCurrentEvent(null); })
      .finally(() => { if (active) setEventContextResolved(true); });
    return () => { active = false; };
  }, [sessionResolved, currentUser, effectiveRole, currentEvent?.id, setCurrentEvent]);

  useEffect(() => {
    const handleExpiredSession = () => {
      logout();
      if (pathname !== "/login" && !pathname.startsWith("/login/")) router.replace("/login");
    };
    window.addEventListener("eventops:session-expired", handleExpiredSession);
    return () => window.removeEventListener("eventops:session-expired", handleExpiredSession);
  }, [logout, pathname, router]);

  useEffect(() => {
    // The shared dashboard is now an Organization Admin landing page only.
    // Redirect legacy bookmarks into the home route for the authenticated role.
    if (sessionResolved && currentUser && pathname === "/dashboard" && effectiveRole !== "ORGANIZATION_ADMIN") {
      const target = effectiveRole === "EVENT_ADMIN" && currentEvent?.id
        ? `/events/detail?eventId=${encodeURIComponent(currentEvent.id)}`
        : getRoleHomeRoute(currentRole);
      router.replace(target);
    }
  }, [sessionResolved, currentUser, pathname, effectiveRole, currentEvent?.id, router]);

  useEffect(() => {
    // Ensure dark class is synchronized on html
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  if (isPublicPage) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </main>
    );
  }

  // Do not show an unauthenticated state while a stored session is being checked.
  if (!sessionResolved || !eventContextResolved) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <p role="status" className="text-sm text-slate-400">Restoring your verified session and event context…</p>
      </main>
    );
  }

  // Enforce authentication for protected operations
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl border border-amber-500/30 bg-slate-900/90 shadow-2xl text-center space-y-5 backdrop-blur-md">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-mono text-white">Authentication Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every session must be authenticated with valid role credentials to prevent unauthorized operations and role misuse.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Authenticate Identity at Login →
          </Button>
        </div>
      </main>
    );
  }

  // Check RBAC permissions for current route
  const accessCheck = checkRouteAccess(effectiveRole, pathname);
  const redirectingLegacyDashboard = pathname === "/dashboard" && currentRole !== "ORGANIZATION_ADMIN";
  if (redirectingLegacyDashboard) {
    return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><p role="status" className="text-sm text-slate-400">Opening your role-specific workspace…</p></main>;
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Organization Admin management uses a focused workspace; role-specific portals keep their own shell. */}
      {!isOrganizationHome && (
        <>
          {/* Desktop Persistent Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Mobile Drawer Sidebar */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="relative z-10 w-72 max-w-[85vw] h-full bg-slate-950 shadow-2xl">
                <Sidebar />
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {accessCheck.authorized ? (
            children
          ) : (
            <AccessDenied attemptedPath={pathname} allowedRoles={accessCheck.allowedRoles} />
          )}
        </main>
      </div>

      {/* Global Quick Command Palette (Cmd+K) */}
      <CommandPalette />
    </div>
  );
};
