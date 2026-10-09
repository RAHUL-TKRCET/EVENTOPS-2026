import { Request, Response, NextFunction } from "express";
import { EventsService } from "./events.service";

export class EventsController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = (req.query.organizationId as string) || req.user?.organizationId;
      const events = EventsService.getAll(orgId);
      return res.status(200).json(events);
    } catch (err: any) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = EventsService.getById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      return res.status(200).json(event);
    } catch (err: any) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user?.userId || "usr-event";
      const event = EventsService.create(req.body, ownerId);
      return res.status(201).json(event);
    } catch (err: any) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const event = EventsService.update(req.params.id, req.body);
      return res.status(200).json(event);
    } catch (err: any) {
      next(err);
    }
  }

  public static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const event = EventsService.setStatus(req.params.id, status);
      return res.status(200).json(event);
    } catch (err: any) {
      next(err);
    }
  }
}

