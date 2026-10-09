import { Request, Response, NextFunction } from "express";
import { AttendanceService } from "./attendance.service";

export class AttendanceController {
  public static async verifyQR(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrCodeToken } = req.body;
      if (!qrCodeToken) {
        return res.status(400).json({ error: "Missing qrCodeToken in request body" });
      }

      const result = AttendanceService.verifyScannedQR(qrCodeToken, req.user?.userId);
      return res.status(result.valid ? 200 : 422).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async getTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId || "evt-01";
      const stats = AttendanceService.getTelemetry(eventId);
      return res.status(200).json(stats);
    } catch (err: any) {
      next(err);
    }
  }
}
