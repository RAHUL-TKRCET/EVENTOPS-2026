import json
import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket

logger = logging.getLogger("eventops.realtime")


class ConnectionManager:
    def __init__(self):
        # Map websocket -> set of subscribed channels
        self.active_connections: Dict[WebSocket, Set[str]] = {}
        # Map websocket -> user context metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, user_info: Dict[str, Any]):
        await websocket.accept()
        self.active_connections[websocket] = set(["events:global:announcements"])
        self.connection_metadata[websocket] = user_info
        logger.info("WebSocket connected for user %s (%s)", user_info.get("email"), user_info.get("role"))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]

    def subscribe(self, websocket: WebSocket, channel: str):
        if websocket in self.active_connections:
            self.active_connections[websocket].add(channel)

    def unsubscribe(self, websocket: WebSocket, channel: str):
        if websocket in self.active_connections:
            self.active_connections[websocket].discard(channel)

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, channel: str, payload: Dict[str, Any]):
        message = json.dumps({
            "channel": channel,
            "payload": payload,
        })
        disconnected = []
        for connection, channels in self.active_connections.items():
            if channel in channels:
                try:
                    await connection.send_text(message)
                except Exception:
                    disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()

