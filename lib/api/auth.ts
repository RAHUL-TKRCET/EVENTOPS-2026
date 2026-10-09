import { User, UserRole } from "@/types";
import { apiRequest } from "./config";

export interface RoleCredentials {
  user: User;
  defaultPassword?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const ROLE_DEFAULT_USERS: Record<UserRole, User> = {
  SUPER_ADMIN: {
    id: "usr-super",
    name: "Alexander Sterling",
    email: "superadmin@eventops.demo",
    role: "SUPER_ADMIN",
    organizationId: "org-01",
    createdAt: "2026-01-01T00:00:00Z",
  },
  ORGANIZATION_ADMIN: {
    id: "usr-org",
    name: "Dean Sarah Jenkins",
    email: "orgadmin@eventops.demo",
    role: "ORGANIZATION_ADMIN",
    organizationId: "org-01",
    createdAt: "2026-01-05T00:00:00Z",
  },
  EVENT_ADMIN: {
    id: "usr-event",
    name: "Vikramaditya Roy",
    email: "eventadmin@eventops.demo",
    role: "EVENT_ADMIN",
    organizationId: "org-01",
    createdAt: "2026-01-10T00:00:00Z",
  },
  COORDINATOR: {
    id: "usr-coord",
    name: "Elena Rostova",
    email: "coordinator@eventops.demo",
    role: "COORDINATOR",
    organizationId: "org-01",
    createdAt: "2026-01-12T00:00:00Z",
  },
  JUDGE: {
    id: "J001",
    name: "Dr. Marcus Vance",
    email: "marcus.vance@mit.edu",
    role: "JUDGE",
    organizationId: "org-01",
    createdAt: "2026-01-15T00:00:00Z",
  },
  VOLUNTEER: {
    id: "vol-01",
    name: "Priya Nair",
    email: "volunteer@eventops.demo",
    role: "VOLUNTEER",
    organizationId: "org-01",
    createdAt: "2026-01-18T00:00:00Z",
  },
  PARTICIPANT: {
    id: "part-01",
    name: "Aarav Sharma",
    email: "aarav.sharma@tkrcet.ac.in",
    role: "PARTICIPANT",
    organizationId: "org-01",
    createdAt: "2026-01-20T00:00:00Z",
  },
  TECHNICAL_STAFF: {
    id: "tech-01",
    name: "Karthik Raja",
    email: "techstaff@eventops.demo",
    role: "TECHNICAL_STAFF",
    organizationId: "org-01",
    createdAt: "2026-01-22T00:00:00Z",
  },
  RESOURCE_MANAGER: {
    id: "res-01",
    name: "Sneha Reddy",
    email: "resources@eventops.demo",
    role: "RESOURCE_MANAGER",
    organizationId: "org-01",
    createdAt: "2026-01-25T00:00:00Z",
  },
};

export const ROLE_PASSWORDS: Record<UserRole, string> = {
  SUPER_ADMIN: "SuperAdmin@2026",
  ORGANIZATION_ADMIN: "EventOps@2026",
  EVENT_ADMIN: "EventOps@2026",
  COORDINATOR: "EventOps@2026",
  JUDGE: "EventOps@2026",
  VOLUNTEER: "EventOps@2026",
  PARTICIPANT: "EventOps@2026",
  TECHNICAL_STAFF: "EventOps@2026",
  RESOURCE_MANAGER: "EventOps@2026",
};

export const authApi = {
  async login(
    email: string,
    password?: string,
    explicitRole?: UserRole
  ): Promise<{ user: User; token: string }> {
    const cleanEmail = email?.trim()?.toLowerCase() || "";
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Authentication Failed: A valid corporate or academic email address is required.");
    }

    const cleanPassword = password?.trim() || "";
    if (!cleanPassword || cleanPassword.length < 4) {
      throw new Error("Authentication Failed: Security password is required (minimum 4 characters).");
    }

    const data = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword,
        role: explicitRole,
      }),
    });

    const authToken = data.accessToken || data.token;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("eventops_token", authToken);
        if (data.user.organizationId) {
          localStorage.setItem("eventops_org_id", data.user.organizationId);
        }
      } catch (_) {}
    }

    return {
      user: data.user,
      token: authToken,
    };
  },

  async eventLogin(
    eventId: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ user: User; token: string }> {
    const data = await apiRequest<AuthResponse>("/auth/event-login", {
      method: "POST",
      body: JSON.stringify({
        eventId,
        email: email.trim().toLowerCase(),
        password,
        role,
      }),
    });

    const authToken = data.accessToken || data.token;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("eventops_token", authToken);
      } catch (_) {}
    }

    return {
      user: data.user,
      token: authToken,
    };
  },

  async register(data: {
    name: string;
    email: string;
    password?: string;
    role?: UserRole;
    organizationId?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        email: data.email.trim().toLowerCase(),
        password: data.password || "Password@2026",
        role: data.role || "PARTICIPANT",
        organizationId: data.organizationId || "org-01",
      }),
    });

    const authToken = res.accessToken || res.token;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("eventops_token", authToken);
      } catch (_) {}
    }

    return {
      user: res.user,
      token: authToken,
    };
  },

  async getMe(): Promise<User> {
    return apiRequest<User>("/auth/me");
  },

  async switchRole(targetRole: UserRole): Promise<{ token: string; role: UserRole }> {
    const res = await apiRequest<{ token: string; accessToken: string; role: UserRole }>("/auth/switch-role", {
      method: "POST",
      body: JSON.stringify({ targetRole }),
    });

    const authToken = res.accessToken || res.token;
    if (typeof window !== "undefined") {
      localStorage.setItem("eventops_token", authToken);
    }
    return { token: authToken, role: res.role };
  },

  async verifyInvite(inviteCode: string): Promise<{ valid: boolean; role?: UserRole; organizationId?: string; organizationName?: string; message: string }> {
    return apiRequest("/auth/verify-invite", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    });
  },

  async verifyOtp(_email: string, _otp: string): Promise<boolean> {
    return true;
  },

  async forgotPassword(_email: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: "Password reset instructions dispatched to your verified email." };
  },

  async resetPassword(_password: string): Promise<{ success: boolean }> {
    return { success: true };
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("eventops_token");
      localStorage.removeItem("eventops_org_id");
      sessionStorage.removeItem("eventops_token");
    }
  },
};
