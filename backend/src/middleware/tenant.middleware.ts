import { Request, Response, NextFunction } from "express";

export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return next();

  // Platform super admins can access any tenant
  if (req.user.role === "SUPER_ADMIN") return next();

  const requestedOrgId = (req.headers["x-organization-id"] as string) || req.params.organizationId;

  // Personal Event Mode (no organization attached) is permitted if user is participant/creator
  if (!requestedOrgId) return next();

  if (req.user.organizationId && req.user.organizationId !== requestedOrgId) {
    return res.status(403).json({
      error: "Tenant Isolation Violation",
      message: "Cross-tenant data access is strictly forbidden.",
      userOrg: req.user.organizationId,
      targetOrg: requestedOrgId,
    });
  }

  next();
}
