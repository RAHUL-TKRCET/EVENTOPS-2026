"use client";

import React, { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useAppStore } from "@/store";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Lock } from "lucide-react";

import { checkRouteAccess } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/AccessDenied";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileSidebarOpen, setMobileSidebarOpen, theme, currentRole, currentUser } = useAppStore();

  // Public pages that do not require an active session
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-otp") ||
    pathname.includes("/portal") ||
    pathname.endsWith("/login");

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
  const accessCheck = checkRouteAccess(currentRole, pathname);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
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
