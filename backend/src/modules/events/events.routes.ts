import { Router } from "express";
import { EventsController } from "./events.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export const eventsRouter = Router();

// Public / Authenticated read routes
eventsRouter.get("/", authenticateJWT, EventsController.getAll);
eventsRouter.get("/:id", authenticateJWT, EventsController.getById);

// Admin / Organizer mutating routes
eventsRouter.post(
  "/",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"]),
  EventsController.create
);

eventsRouter.put(
  "/:id",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"]),
  EventsController.update
);

eventsRouter.patch(
  "/:id/status",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"]),
  EventsController.setStatus
);
