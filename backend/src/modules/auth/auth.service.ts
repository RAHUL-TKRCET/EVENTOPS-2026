import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../../config";
import { UserRole, AuthTokenPayload } from "../../types";
import { db } from "../../database/connection";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId?: string | null;
  createdAt: string;
}

// In-memory persistent demo accounts matching all 9 system roles with verified credentials
const defaultHash = bcrypt.hashSync("admin123", 10);
const participantHash = bcrypt.hashSync("participant123", 10);

export const inMemoryUsers: UserRecord[] = [
  { id: "usr-super", name: "Alexander Sterling", email: "superadmin@eventops.demo", passwordHash: defaultHash, role: "SUPER_ADMIN", organizationId: "org-01", createdAt: "2026-01-01T00:00:00Z" },
  { id: "usr-org", name: "Dean Sarah Jenkins", email: "orgadmin@eventops.demo", passwordHash: defaultHash, role: "ORGANIZATION_ADMIN", organizationId: "org-01", createdAt: "2026-01-05T00:00:00Z" },
  { id: "usr-event", name: "Vikramaditya Roy", email: "eventadmin@eventops.demo", passwordHash: defaultHash, role: "EVENT_ADMIN", organizationId: "org-01", createdAt: "2026-01-10T00:00:00Z" },
  { id: "usr-coord", name: "Elena Rostova", email: "coordinator@eventops.demo", passwordHash: defaultHash, role: "COORDINATOR", organizationId: "org-01", createdAt: "2026-01-12T00:00:00Z" },
  { id: "J001", name: "Dr. Marcus Vance", email: "marcus.vance@mit.edu", passwordHash: defaultHash, role: "JUDGE", organizationId: "org-01", createdAt: "2026-01-15T00:00:00Z" },
  { id: "vol-01", name: "Priya Nair", email: "volunteer@eventops.demo", passwordHash: defaultHash, role: "VOLUNTEER", organizationId: "org-01", createdAt: "2026-01-18T00:00:00Z" },
  { id: "part-01", name: "Aarav Sharma", email: "aarav.sharma@tkrcet.ac.in", passwordHash: participantHash, role: "PARTICIPANT", organizationId: "org-01", createdAt: "2026-01-20T00:00:00Z" },
  { id: "tech-01", name: "Karthik Raja", email: "techstaff@eventops.demo", passwordHash: defaultHash, role: "TECHNICAL_STAFF", organizationId: "org-01", createdAt: "2026-01-22T00:00:00Z" },
  { id: "res-01", name: "Sneha Reddy", email: "resourcemanager@eventops.demo", passwordHash: defaultHash, role: "RESOURCE_MANAGER", organizationId: "org-01", createdAt: "2026-01-25T00:00:00Z" },
];

export class AuthService {
  public static generateTokens(user: { id: string; email: string; role: UserRole; organizationId?: string | null }) {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: "7d" });

    return { accessToken, refreshToken, expiresIn: 86400 };
  }

  public static async login(email: string, password: string, requestedRole?: UserRole) {
    // 1. Check PostgreSQL database first
    const dbRes = await db.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    let user: UserRecord | undefined;

    if (dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      user = {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role as UserRole,
        organizationId: row.organization_id,
        createdAt: row.created_at,
      };
    } else {
      user = inMemoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    if (requestedRole && user.role !== requestedRole && user.role !== "SUPER_ADMIN") {
      throw new Error(`Unauthorized: Account role is ${user.role}, but requested ${requestedRole}`);
    }

    const effectiveRole = requestedRole && user.role === "SUPER_ADMIN" ? requestedRole : user.role;
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: effectiveRole,
      organizationId: user.organizationId,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: effectiveRole,
        organizationId: user.organizationId,
      },
      ...tokens,
    };
  }

  public static async register(data: { name: string; email: string; password: string; role?: UserRole; organizationId?: string }) {
    // Check PostgreSQL first
    const dbCheck = await db.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [data.email]);
    if (dbCheck.rows.length > 0) {
      throw new Error("An account with this email already exists in PostgreSQL database");
    }

    const exists = inMemoryUsers.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      throw new Error("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = `usr-${Date.now()}`;
    const userRole = data.role || "PARTICIPANT";
    const orgId = data.organizationId || "org-01";

    // Insert directly into PostgreSQL database
    try {
      await db.query(
        `INSERT INTO users (id, name, email, password_hash, role, organization_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, data.name, data.email, passwordHash, userRole, orgId]
      );
      console.log(`[PostgreSQL] User '${data.email}' (${userRole}) registered and stored in database.`);
    } catch (err: any) {
      console.warn(`[PostgreSQL] User insert note:`, err.message);
    }

    const newUser: UserRecord = {
      id: userId,
      name: data.name,
      email: data.email,
      passwordHash,
      role: userRole,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    };

    inMemoryUsers.push(newUser);
    const tokens = this.generateTokens(newUser);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId,
      },
      ...tokens,
    };
  }

  public static async verifyInvite(inviteCode: string) {
    if (inviteCode.toUpperCase().startsWith("INV-JURY")) {
      return { valid: true, role: "JUDGE", organization: "VISTERA Engineering Academy", code: inviteCode };
    }
    if (inviteCode.toUpperCase().startsWith("INV-VOL")) {
      return { valid: true, role: "VOLUNTEER", organization: "VISTERA Operations Cell", code: inviteCode };
    }
    return { valid: false, message: "Invitation token invalid or expired" };
  }
}

