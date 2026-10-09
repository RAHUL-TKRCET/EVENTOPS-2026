import { Router, Request, Response } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export interface ResourceItem {
  id: string;
  eventId: string;
  category: "BADGES" | "KITS" | "MEALS" | "EQUIPMENT";
  name: string;
  totalQuantity: number;
  distributedCount: number;
}

export const inMemoryResources: ResourceItem[] = [
  { id: "res-1", eventId: "evt-01", category: "BADGES", name: "NFC / QR Holographic Badges", totalQuantity: 500, distributedCount: 384 },
  { id: "res-2", eventId: "evt-01", category: "KITS", name: "VISTERA 2026 Welcome Kits (Backpack & T-Shirt)", totalQuantity: 500, distributedCount: 372 },
  { id: "res-3", eventId: "evt-01", category: "MEALS", name: "Day 1 Dinner Meal Coupons", totalQuantity: 500, distributedCount: 410 },
  { id: "res-4", eventId: "evt-01", category: "EQUIPMENT", name: "ESP32-S3 AI Development Boards", totalQuantity: 50, distributedCount: 28 },
];

export const resourcesRouter = Router();

resourcesRouter.get("/events/:eventId", authenticateJWT, (req: Request, res: Response) => {
  res.status(200).json(inMemoryResources.filter((r) => r.eventId === req.params.eventId));
});

resourcesRouter.post(
  "/distribute",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "EVENT_ADMIN", "COORDINATOR", "RESOURCE_MANAGER", "VOLUNTEER"]),
  (req: Request, res: Response) => {
    const { resourceId, quantity = 1, teamId } = req.body;
    const item = inMemoryResources.find((r) => r.id === resourceId);
    if (!item) return res.status(404).json({ error: "Resource item not found" });

    if (item.distributedCount + quantity > item.totalQuantity) {
      return res.status(400).json({ error: "Insufficient inventory remaining" });
    }

    item.distributedCount += quantity;
    res.status(200).json({
      success: true,
      message: `Handoff recorded for ${item.name}`,
      item,
      teamId,
      timestamp: new Date().toISOString(),
    });
  }
);

