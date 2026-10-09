import { Request, Response, NextFunction } from "express";
import { AuthService, inMemoryUsers } from "./auth.service";
import { LoginSchema, RegisterSchema, SwitchRoleSchema, VerifyInviteSchema } from "./auth.schema";

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = LoginSchema.parse(req.body);
      const result = await AuthService.login(validated.email, validated.password, validated.role);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(401).json({ error: "Authentication failed", message: err.message });
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = RegisterSchema.parse(req.body);
      const result = await AuthService.register(validated);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: "Registration failed", message: err.message });
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const user = inMemoryUsers.find((u) => u.id === req.user?.userId);
      return res.status(200).json({
        user: user
          ? { id: user.id, name: user.name, email: user.email, role: req.user.role, organizationId: user.organizationId }
          : { id: req.user.userId, email: req.user.email, role: req.user.role },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async switchRole(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { targetRole } = SwitchRoleSchema.parse(req.body);

      // Only SUPER_ADMIN can switch dynamically to any role
      if (req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Forbidden", message: "Only SUPER_ADMIN accounts can dynamically switch roles." });
      }

      const tokens = AuthService.generateTokens({
        id: req.user.userId,
        email: req.user.email,
        role: targetRole,
        organizationId: req.user.organizationId,
      });

      return res.status(200).json({
        message: `Switched active role to ${targetRole}`,
        role: targetRole,
        ...tokens,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async verifyInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteCode } = VerifyInviteSchema.parse(req.body);
      const result = await AuthService.verifyInvite(inviteCode);
      return res.status(result.valid ? 200 : 400).json(result);
    } catch (err: any) {
      next(err);
    }
  }
}
