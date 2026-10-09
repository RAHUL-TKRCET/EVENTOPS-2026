import { Router, Request, Response, NextFunction } from "express";
import { TeamsService } from "./teams.service";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export const teamsRouter = Router();

teamsRouter.get("/events/:eventId", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = TeamsService.getAll(req.params.eventId);
    res.status(200).json(teams);
  } catch (err: any) {
    next(err);
  }
});

teamsRouter.get("/:id", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = TeamsService.getById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.status(200).json(team);
  } catch (err: any) {
    next(err);
  }
});

teamsRouter.post("/", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const newTeam = TeamsService.create(req.body);
    res.status(201).json(newTeam);
  } catch (err: any) {
    next(err);
  }
});

teamsRouter.patch("/:id/project", authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = TeamsService.updateProject(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (err: any) {
    next(err);
  }
});

