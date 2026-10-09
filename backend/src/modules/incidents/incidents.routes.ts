import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";

export interface IncidentRecord {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  location: string;
  reportedBy: string;
  assignedTo?: string;
  resolutionNotes?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export const inMemoryIncidents: IncidentRecord[] = [
  {
    id: "inc-01",
    eventId: "evt-01",
    title: "Bench A-04 Circuit Trip",
    description: "Circuit breaker tripped due to dual soldering iron load on pulpit.",
    category: "ELECTRICAL",
    severity: "HIGH",
    status: "INVESTIGATING",
    location: "Turing Lab 101, Bench A-04",
    reportedBy: "Aarav Sharma (Team NeuralPulse)",
    assignedTo: "Karthik Raja (Technical Staff)",
    reportedAt: "2026-10-15T15:10:00Z",
  },
  {
    id: "inc-02",
    eventId: "evt-01",
    title: "Wi-Fi Subnet 5GHz DHCP Exhaustion",
    description: "New team laptops failing to acquire IP addresses in Hall 2.",
    category: "NETWORK",
    severity: "MEDIUM",
    status: "RESOLVED",
    location: "Hall 2 West Wing",
    reportedBy: "Elena Rostova (Floor Coordinator)",
    assignedTo: "NetOps Team",
    resolutionNotes: "Expanded DHCP pool from /24 to /22 subnet.",
    reportedAt: "2026-10-15T10:30:00Z",
    resolvedAt: "2026-10-15T10:45:00Z",
  },
];

export const incidentsRouter = Router();

incidentsRouter.get("/events/:eventId", authenticateJWT, (req: Request, res: Response) => {
  res.status(200).json(inMemoryIncidents.filter((i) => i.eventId === req.params.eventId));
});

incidentsRouter.post("/", authenticateJWT, (req: Request, res: Response) => {
  const newIncident: IncidentRecord = {
    id: `inc-${Date.now()}`,
    eventId: req.body.eventId || "evt-01",
    title: req.body.title || "Operations Alert",
    description: req.body.description || "",
    category: req.body.category || "GENERAL",
    severity: req.body.severity || "MEDIUM",
    status: "OPEN",
    location: req.body.location || "Main Venue",
    reportedBy: req.user ? `${req.user.email} (${req.user.role})` : "Attendee",
    reportedAt: new Date().toISOString(),
  };
  inMemoryIncidents.unshift(newIncident);
  res.status(201).json(newIncident);
});

incidentsRouter.patch(
  "/:id/status",
  authenticateJWT,
  requireRoles(["SUPER_ADMIN", "EVENT_ADMIN", "COORDINATOR", "TECHNICAL_STAFF"]),
  (req: Request, res: Response) => {
    const inc = inMemoryIncidents.find((i) => i.id === req.params.id);
    if (!inc) return res.status(404).json({ error: "Incident not found" });
    if (req.body.status) inc.status = req.body.status;
    if (req.body.assignedTo) inc.assignedTo = req.body.assignedTo;
    if (req.body.resolutionNotes) {
      inc.resolutionNotes = req.body.resolutionNotes;
      inc.resolvedAt = new Date().toISOString();
    }
    res.status(200).json(inc);
  }
);
