import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export const attendanceRouter = Router();

// Endpoint called by camera QR scanner desks (Volunteers, Coordinators, Admins, etc.)
attendanceRouter.post(
  "/verify-qr",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "EVENT_ADMIN", "COORDINATOR", "VOLUNTEER", "RESOURCE_MANAGER"]),
  AttendanceController.verifyQR
);

// Attendance telemetry metrics
attendanceRouter.get(
  "/events/:eventId/telemetry",
  authenticateJWT,
  AttendanceController.getTelemetry
);
