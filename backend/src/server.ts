import http from "http";
import { createApp } from "./app";
import { config } from "./config";
import { realtime } from "./websocket/server";
import { db } from "./database/connection";

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Real-time WebSocket pub/sub engine
  realtime.init(server);

  // Test optional database connectivity
  await db.testConnection();

  server.listen(config.port, () => {
    console.log("==================================================================");
    console.log(`🚀 EVENTOPS 2026 Modular Backend Service running`);
    console.log(`📡 HTTP REST API: http://localhost:${config.port}/api/v1`);
    console.log(`⚡ WebSocket Engine: ws://localhost:${config.port}/ws`);
    console.log(`🩺 Health Probe:   http://localhost:${config.port}/health`);
    console.log(`🔒 RBAC Modules:   9 Roles (Super Admin to Participant) Active`);
    console.log(`🎫 QR Engine:      HMAC-SHA256 Cryptographic Verification Active`);
    console.log("==================================================================");
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
