import express, { Application, Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import { auditLogger } from "./middleware/audit.middleware";
import { errorHandler } from "./middleware/error.middleware";

import { authRouter } from "./modules/auth/auth.routes";
import { eventsRouter } from "./modules/events/events.routes";
import { teamsRouter } from "./modules/teams/teams.routes";
import { venuesRouter } from "./modules/venues/venues.routes";
import { attendanceRouter } from "./modules/attendance/attendance.routes";
import { evaluationRouter } from "./modules/evaluation/evaluation.routes";
import { allocationRouter } from "./modules/allocation/allocation.routes";
import { incidentsRouter } from "./modules/incidents/incidents.routes";
import { resourcesRouter } from "./modules/resources/resources.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";

export function createApp(): Application {
  const app = express();

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: [config.clientOrigin, "http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-organization-id"],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Audit Logging Middleware
  app.use(auditLogger);

  // System Health Liveness Check
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "HEALTHY",
      service: "EVENTOPS-2026 Core Backend",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Designated Module Routers Mounted under /api/v1
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/events", eventsRouter);
  app.use("/api/v1/teams", teamsRouter);
  app.use("/api/v1/venues", venuesRouter);
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1/evaluation", evaluationRouter);
  app.use("/api/v1/allocation", allocationRouter);
  app.use("/api/v1/incidents", incidentsRouter);
  app.use("/api/v1/resources", resourcesRouter);
  app.use("/api/v1/analytics", analyticsRouter);

  // 404 Route Catch-All
  app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
      error: "NotFound",
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
      availableEndpoints: "/api/v1/*",
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
