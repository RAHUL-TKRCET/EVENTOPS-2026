import { Router, Request, Response, NextFunction } from "express";
import { VenuesService } from "./venues.service";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export const venuesRouter = Router();

venuesRouter.get("/events/:eventId", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const venues = VenuesService.getAll(req.params.eventId);
    res.status(200).json(venues);
  } catch (err: any) {
    next(err);
  }
});

venuesRouter.get("/:id", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = VenuesService.getById(req.params.id);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    res.status(200).json(venue);
  } catch (err: any) {
    next(err);
  }
});

venuesRouter.patch(
  "/:venueId/benches/:benchId",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "EVENT_ADMIN", "COORDINATOR", "TECHNICAL_STAFF"]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = VenuesService.updateBench(req.params.venueId, req.params.benchId, req.body);
      res.status(200).json(updated);
    } catch (err: any) {
      next(err);
    }
  }
);
