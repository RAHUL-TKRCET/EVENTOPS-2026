import { Request, Response, NextFunction } from "express";

export interface AuditRecord {
  id: string;
  userId?: string;
  role?: string;
  method: string;
  path: string;
  statusCode: number;
  ip: string;
  timestamp: string;
}

export const inMemoryAuditLogs: AuditRecord[] = [];

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    // Only audit mutating and sensitive methods or failure codes
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || res.statusCode >= 400) {
      const record: AuditRecord = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: req.user?.userId,
        role: req.user?.role,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip || req.socket.remoteAddress || "127.0.0.1",
        timestamp: new Date().toISOString(),
      };
      inMemoryAuditLogs.unshift(record);
      if (inMemoryAuditLogs.length > 500) inMemoryAuditLogs.pop();
    }
  });

  next();
}

