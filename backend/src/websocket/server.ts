import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";

export interface ClientConnection {
  ws: WebSocket;
  subscribedChannels: Set<string>;
  userId?: string;
}

export class RealtimeEngine {
  private static instance: RealtimeEngine;
  private wss: WebSocketServer | null = null;
  private clients: Set<ClientConnection> = new Set();

  private constructor() {}

  public static getInstance(): RealtimeEngine {
    if (!RealtimeEngine.instance) {
      RealtimeEngine.instance = new RealtimeEngine();
    }
    return RealtimeEngine.instance;
  }

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      const client: ClientConnection = {
        ws,
        subscribedChannels: new Set<string>(["events:global:announcements"]),
      };
      this.clients.add(client);

      ws.send(
        JSON.stringify({
          type: "CONNECTED",
          message: "Connected to EVENTOPS 2026 Real-Time Engine",
          timestamp: new Date().toISOString(),
        })
      );

      ws.on("message", (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "SUBSCRIBE" && message.channel) {
            client.subscribedChannels.add(message.channel);
            ws.send(JSON.stringify({ type: "SUBSCRIBED", channel: message.channel }));
          } else if (message.type === "UNSUBSCRIBE" && message.channel) {
            client.subscribedChannels.delete(message.channel);
            ws.send(JSON.stringify({ type: "UNSUBSCRIBED", channel: message.channel }));
          } else if (message.type === "PING") {
            ws.send(JSON.stringify({ type: "PONG" }));
          }
        } catch (err: any) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Malformed WebSocket message" }));
        }
      });

      ws.on("close", () => {
        this.clients.delete(client);
      });
    });

    console.log("[WebSocket] Real-time reactive pub/sub engine initialized on /ws");
  }

  public broadcast(channel: string, payload: any) {
    const data = JSON.stringify({
      channel,
      payload,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.subscribedChannels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }
}

export const realtime = RealtimeEngine.getInstance();
