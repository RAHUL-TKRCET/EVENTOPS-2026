type WebSocketEventHandler = (data: any) => void;

export type EventOpsSocketEvent =
  | "attendance.updated"
  | "judge.status.updated"
  | "room.occupancy.updated"
  | "volunteer.task.updated"
  | "incident.created"
  | "incident.updated"
  | "evaluation.updated"
  | "round.updated"
  | "announcement.created";

class EventOpsWebSocketClient {
  private listeners: Map<EventOpsSocketEvent, Set<WebSocketEventHandler>> = new Map();
  private isConnected = true;
  private intervalId: any = null;

  constructor() {
    this.startSimulation();
  }

  public subscribe(event: EventOpsSocketEvent, handler: WebSocketEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  public emit(event: EventOpsSocketEvent, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }

  private startSimulation() {
    if (typeof window === "undefined") return;

    // Periodically simulate subtle operational heartbeats
    this.intervalId = setInterval(() => {
      // Simulate live check-in or task completion
      const events: EventOpsSocketEvent[] = [
        "attendance.updated",
        "room.occupancy.updated",
        "volunteer.task.updated",
      ];
      const selected = events[Math.floor(Math.random() * events.length)];
      this.emit(selected, { timestamp: new Date().toISOString(), simulated: true });
    }, 25000);
  }

  public disconnect() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isConnected = false;
  }
}

export const eventOpsSocket = new EventOpsWebSocketClient();
