import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";

export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication context missing.",
      });
    }

    // SUPER_ADMIN has platform-wide wildcard authorization
    if (req.user.role === "SUPER_ADMIN" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: "Access Denied",
      message: `Role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${allowedRoles.join(", ")}]`,
      currentRole: req.user.role,
    });
  };
}
