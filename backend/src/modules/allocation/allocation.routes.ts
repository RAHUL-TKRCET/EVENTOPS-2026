import { Router, Request, Response, NextFunction } from "express";
import { AllocationService } from "./allocation.service";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export const allocationRouter = Router();

allocationRouter.get("/requirements", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = (req.query.eventId as string) || "evt-01";
    res.status(200).json(AllocationService.getRequirements(eventId));
  } catch (err: any) {
    next(err);
  }
});

allocationRouter.get("/constraints", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(AllocationService.getConstraints());
  } catch (err: any) {
    next(err);
  }
});

allocationRouter.post(
  "/solve",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "EVENT_ADMIN", "COORDINATOR"]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.body.eventId || "evt-01";
      const results = AllocationService.solveOptimization(eventId);
      res.status(200).json(results);
    } catch (err: any) {
      next(err);
    }
  }
);

