import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.security import decode_token
from app.core.events import manager

logger = logging.getLogger("eventops.websocket")

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """Authenticated real-time reactive WebSocket connection."""
    user_claims = None
    if token:
        user_claims = decode_token(token)

    if not user_claims:
        # If token not in query, allow initial auth handshake frame
        await websocket.accept()
        try:
            auth_raw = await websocket.receive_text()
            auth_msg = json.loads(auth_raw)
            if auth_msg.get("type") == "AUTH" and auth_msg.get("token"):
                user_claims = decode_token(auth_msg["token"])
        except Exception:
            pass

        if not user_claims:
            await websocket.send_text(json.dumps({
                "type": "AUTH_ERROR",
                "message": "Authentication failed: Valid Bearer JWT required to establish real-time session.",
            }))
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    else:
        await manager.connect(websocket, user_claims)

    # Initial Welcome Frame
    await websocket.send_text(json.dumps({
        "type": "CONNECTED",
        "message": "Authenticated session established with EVENTOPS Real-Time Engine.",
        "user": user_claims.get("email"),
        "role": user_claims.get("role"),
        "subscribedChannels": list(manager.active_connections.get(websocket, set())),
    }))

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                mtype = message.get("type")

                if mtype == "SUBSCRIBE":
                    channel = message.get("channel")
                    if channel:
                        manager.subscribe(websocket, channel)
                        await websocket.send_text(json.dumps({"type": "SUBSCRIBED", "channel": channel}))

                elif mtype == "UNSUBSCRIBE":
                    channel = message.get("channel")
                    if channel:
                        manager.unsubscribe(websocket, channel)
                        await websocket.send_text(json.dumps({"type": "UNSUBSCRIBED", "channel": channel}))

                elif mtype == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "ERROR", "message": "Invalid JSON frame."}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected.")

