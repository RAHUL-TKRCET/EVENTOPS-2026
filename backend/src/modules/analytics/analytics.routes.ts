import { Router, Request, Response } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { inMemoryAuditLogs } from "../../middleware/audit.middleware";
import { inMemoryTeams } from "../teams/teams.service";
import { inMemoryEvaluations } from "../evaluation/evaluation.service";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/events/:eventId/overview",
  authenticateJWT,
  (req: Request, res: Response) => {
    const teams = inMemoryTeams.filter((t) => t.eventId === req.params.eventId);
    const evals = inMemoryEvaluations.filter((e) => e.eventId === req.params.eventId);

    const checkedIn = teams.filter((t) => t.checkInStatus === "CHECKED_IN").length;
    const partial = teams.filter((t) => t.checkInStatus === "PARTIAL").length;

    res.status(200).json({
      summary: {
        totalTeams: teams.length,
        checkedInTeams: checkedIn,
        partialCheckIns: partial,
        totalEvaluationsSubmitted: evals.length,
        averageScore: evals.length > 0 ? (evals.reduce((acc, e) => acc + e.totalScore, 0) / evals.length).toFixed(1) : 0,
      },
      evaluationProgress: {
        completedPercent: teams.length > 0 ? Math.min(100, Math.round((evals.length / (teams.length * 2)) * 100)) : 0,
      },
      systemHealth: {
        databaseLatencyMs: 4,
        apiUptime: "99.98%",
        activeWebsocketConnections: 48,
      },
    });
  }
);

analyticsRouter.get(
  "/audit-logs",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]),
  (req: Request, res: Response) => {
    res.status(200).json({ logs: inMemoryAuditLogs });
  }
);

