import { create } from "zustand";
import { User, Organization, EventItem, UserRole, WorkspaceMode } from "@/types";
import { mockUsers } from "@/lib/mock-data/users";
import { mockOrganizations, mockInvitations } from "@/lib/mock-data/organizations";
import { mockEvents, mockPersonalEvents } from "@/lib/mock-data/events";

interface AppState {
  currentUser: User | null;
  currentRole: UserRole;
  currentOrganization: Organization | null;
  currentEvent: EventItem | null;
  theme: "dark" | "light";
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  activeNotificationCount: number;

  // Workspace Mode State
  workspaceMode: WorkspaceMode;
  userOrganizations: Organization[];
  personalEvents: EventItem[];
  activePersonalEvent: EventItem | null;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentRole: (role: UserRole) => void;
  setCurrentOrganization: (org: Organization | null) => void;
  setCurrentEvent: (event: EventItem | null) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  selectOrganizationWorkspace: (orgId: string) => void;
  selectPersonalEventWorkspace: (eventId: string) => void;
  createOrganization: (orgData: Partial<Organization>) => Organization;
  joinOrganization: (inviteCode: string) => { success: boolean; organization?: Organization; role?: UserRole; message: string };
  createPersonalEvent: (eventData: Partial<EventItem>) => EventItem;
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  decrementNotificationCount: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[0] || null,
  currentRole: "EVENT_ADMIN",
  currentOrganization: mockOrganizations[0] || null,
  currentEvent: mockEvents[0] || null,
  theme: "dark",
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  isCommandPaletteOpen: false,
  activeNotificationCount: 0,

  // Workspace Mode State
  workspaceMode: "ORGANIZATION",
  userOrganizations: mockOrganizations,
  personalEvents: mockPersonalEvents,
  activePersonalEvent: mockPersonalEvents[0] || null,

  setCurrentUser: (user) => set({ currentUser: user, currentRole: user ? user.role : "EVENT_ADMIN" }),
  setCurrentRole: (role) =>
    set((state) => {
      if (state.currentUser && state.currentUser.role !== "SUPER_ADMIN" && state.currentUser.role !== role) {
        return { currentRole: state.currentUser.role };
      }
      return { currentRole: role, currentUser: state.currentUser ? { ...state.currentUser, role } : null };
    }),
  setCurrentOrganization: (org) => set({ currentOrganization: org, workspaceMode: "ORGANIZATION" }),
  setCurrentEvent: (event) => set({ currentEvent: event }),
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),

  selectOrganizationWorkspace: (orgId: string) => {
    const org = get().userOrganizations.find((o) => o.id === orgId) || mockOrganizations.find((o) => o.id === orgId) || null;
    if (org) {
      const orgEvents = mockEvents.filter((e) => e.organizationId === org.id);
      set({
        currentOrganization: org,
        workspaceMode: "ORGANIZATION",
        currentRole: "ORGANIZATION_ADMIN",
        currentEvent: orgEvents[0] || get().currentEvent,
      });
    }
  },

  selectPersonalEventWorkspace: (eventId: string) => {
    const event = get().personalEvents.find((e) => e.id === eventId) || mockEvents.find((e) => e.id === eventId) || null;
    if (event) {
      set({
        currentEvent: event,
        activePersonalEvent: event,
        workspaceMode: "PERSONAL",
        currentRole: "EVENT_ADMIN",
      });
    }
  },

  createOrganization: (orgData: Partial<Organization>) => {
    const state = get();
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: orgData.name || "Untitled Organization",
      type: orgData.type || "Institution",
      subtype: orgData.subtype || "College",
      description: orgData.description || "",
      country: orgData.country || "India",
      city: orgData.city || "Bengaluru",
      website: orgData.website || "",
      size: orgData.size || "100-500",
      plan: "Enterprise",
      activeEventsCount: 0,
      membersCount: 1,
      ownerId: state.currentUser ? state.currentUser.id : "usr-01",
      contactEmail: orgData.contactEmail || (state.currentUser ? state.currentUser.email : ""),
      contactPhone: orgData.contactPhone || "",
      createdAt: new Date().toISOString(),
      ...orgData,
    };

    set({
      userOrganizations: [newOrg, ...state.userOrganizations],
      currentOrganization: newOrg,
      currentRole: "ORGANIZATION_ADMIN",
      currentUser: state.currentUser
        ? { ...state.currentUser, role: "ORGANIZATION_ADMIN", organizationId: newOrg.id }
        : null,
      workspaceMode: "ORGANIZATION",
    });

    return newOrg;
  },

  joinOrganization: (inviteCode: string) => {
    const code = inviteCode.trim().toUpperCase();
    const invitation = mockInvitations.find((inv) => inv.code.toUpperCase() === code);

    if (!invitation) {
      return {
        success: false,
        message: "Invalid invitation code.",
      };
    }

    const state = get();
    const existingOrg =
      state.userOrganizations.find((o) => o.id === invitation.organizationId) ||
      mockOrganizations.find((o) => o.id === invitation.organizationId);

    const targetOrg: Organization = existingOrg || {
      id: invitation.organizationId,
      name: invitation.organizationName,
      type: (invitation.organizationType as any) || "Institution",
      subtype: invitation.subtype as any,
      description: `Member of ${invitation.organizationName}`,
      country: "India",
      city: "Hyderabad",
      website: "https://eventops.demo",
      size: "500+",
      plan: "Enterprise",
      activeEventsCount: 1,
      membersCount: 50,
      ownerId: "usr-01",
      createdAt: new Date().toISOString(),
    };

    const updatedOrgs: Organization[] = state.userOrganizations.some((o) => o.id === targetOrg.id)
      ? state.userOrganizations
      : [targetOrg, ...state.userOrganizations];

    set({
      userOrganizations: updatedOrgs,
      currentOrganization: targetOrg,
      currentRole: invitation.invitedRole,
      currentUser: state.currentUser
        ? {
            ...state.currentUser,
            role: invitation.invitedRole,
            organizationId: targetOrg.id,
          }
        : null,
      workspaceMode: "ORGANIZATION",
    });

    return {
      success: true,
      organization: targetOrg,
      role: invitation.invitedRole,
      message: `Joined ${targetOrg.name} successfully as ${invitation.invitedRole}!`,
    };
  },

  createPersonalEvent: (eventData: Partial<EventItem>) => {
    const state = get();
    const newEvent: EventItem = {
      id: `evt-personal-${Date.now()}`,
      organizationId: null,
      ownerId: state.currentUser ? state.currentUser.id : "usr-01",
      isPersonalEvent: true,
      name: eventData.name || "Untitled Personal Event",
      type: eventData.type || "Workshop",
      description: eventData.description || "",
      startDate: eventData.startDate || new Date(Date.now() + 86400000 * 2).toISOString(),
      endDate: eventData.endDate || new Date(Date.now() + 86400000 * 3).toISOString(),
      registrationDeadline: eventData.registrationDeadline || new Date(Date.now() + 86400000).toISOString(),
      status: "PUBLISHED",
      expectedParticipants: eventData.expectedParticipants || 50,
      registeredTeamsCount: 0,
      currentRound: 1,
      totalRounds: 1,
      venuesCount: 1,
      judgesCount: 1,
      location: eventData.location || "Virtual / Online",
      bannerUrl: eventData.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      rounds: [],
      timeSlots: [],
      rules: [],
      ...eventData,
    };

    set({
      personalEvents: [newEvent, ...state.personalEvents],
      currentEvent: newEvent,
      activePersonalEvent: newEvent,
      workspaceMode: "PERSONAL",
      currentRole: "EVENT_ADMIN",
    });

    return newEvent;
  },


  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return { theme: nextTheme };
    }),

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme });
  },

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  decrementNotificationCount: () =>
    set((state) => ({ activeNotificationCount: Math.max(0, state.activeNotificationCount - 1) })),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("eventops_token");
      sessionStorage.removeItem("eventops_token");
    }
    set({
      currentUser: null,
      currentRole: "EVENT_ADMIN",
      currentOrganization: null,
      currentEvent: null,
      workspaceMode: "ORGANIZATION",
    });
  },
}));
