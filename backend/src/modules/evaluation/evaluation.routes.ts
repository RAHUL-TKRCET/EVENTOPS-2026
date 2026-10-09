import { Router, Request, Response, NextFunction } from "express";
import { EvaluationService } from "./evaluation.service";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export const evaluationRouter = Router();

evaluationRouter.get("/judge/:judgeId", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = EvaluationService.getByJudge(req.params.judgeId);
    res.status(200).json(records);
  } catch (err: any) {
    next(err);
  }
});

evaluationRouter.get("/team/:teamId", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = EvaluationService.getByTeam(req.params.teamId);
    res.status(200).json(records);
  } catch (err: any) {
    next(err);
  }
});

// Scorecard submission by Judges or Admins
evaluationRouter.post(
  "/submit",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "EVENT_ADMIN", "JUDGE"]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = EvaluationService.submit({
        ...req.body,
        judgeId: req.user?.role === "JUDGE" ? req.user.userId : (req.body.judgeId || "J001"),
      });
      res.status(201).json(record);
    } catch (err: any) {
      next(err);
    }
  }
);

// Real-time leaderboard
evaluationRouter.get("/events/:eventId/leaderboard", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = EvaluationService.getLeaderboard(req.params.eventId, req.query.roundId as string);
    res.status(200).json(leaderboard);
  } catch (err: any) {
    next(err);
  }
});
