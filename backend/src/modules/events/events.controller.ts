import { Request, Response, NextFunction } from "express";
import { EventsService } from "./events.service";

export class EventsController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = (req.query.organizationId as string) || req.user?.organizationId;
      const events = await EventsService.getAll(orgId);
      return res.status(200).json(events);
    } catch (err: any) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventsService.getById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      return res.status(200).json(event);
    } catch (err: any) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user?.userId || "usr-event";
      const event = await EventsService.create(req.body, ownerId);
      return res.status(201).json(event);
    } catch (err: any) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventsService.update(req.params.id, req.body);
      return res.status(200).json(event);
    } catch (err: any) {
      next(err);
    }
  }

  public static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const event = await EventsService.setStatus(req.params.id, status);
      return res.status(200).json(event);
    } catch (err: any) {
      next(err);
    }
  }

  public static async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const addedBy = req.user?.userId || "usr-event";
      const result = await EventsService.addMember(id, req.body, addedBy);
      return res.status(201).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const members = await EventsService.getMembers(id);
      return res.status(200).json(members);
    } catch (err: any) {
      next(err);
    }
  }

  public static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, memberId } = req.params;
      const result = await EventsService.removeMember(id, memberId);
      return res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const summary = await EventsService.getEventSummary(id);
      return res.status(200).json(summary);
    } catch (err: any) {
      next(err);
    }
  }
}

