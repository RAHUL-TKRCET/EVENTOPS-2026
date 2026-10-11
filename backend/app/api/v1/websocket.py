import json
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.core.events import manager
from app.models.entities import Event, EventMember, OrganizationMembership, User

logger = logging.getLogger("eventops.websocket")

router = APIRouter()
ALLOWED_ATTENDANCE_ROLES = {
    "SUPER_ADMIN",
    "ORGANIZATION_ADMIN",
    "EVENT_ADMIN",
    "COORDINATOR",
    "VOLUNTEER",
    "TECHNICAL_STAFF",
}


def validate_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Validate access-token type, account state, and any scoped assignment."""
    claims = decode_token(token)
    if not claims or claims.get("type") != "access" or not claims.get("sub"):
        return None

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == str(claims["sub"])).first()
        if not user:
            return None

        role = claims.get("role", user.role)
        event_id = claims.get("eventId")
        organization_id = claims.get("organizationId")

        if event_id:
            membership = (
                db.query(EventMember)
                .filter(
                    EventMember.event_id == event_id,
                    EventMember.user_id == user.id,
                    EventMember.role == role,
                    EventMember.status == "ACTIVE",
                )
                .first()
            )
            if not membership:
                return None
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event or not organization_id or event.organization_id != organization_id:
                return None
        elif role == "ORGANIZATION_ADMIN":
            membership = (
                db.query(OrganizationMembership)
                .filter(
                    OrganizationMembership.user_id == user.id,
                    OrganizationMembership.organization_id == organization_id,
                    OrganizationMembership.role == "ORGANIZATION_ADMIN",
                    OrganizationMembership.status == "ACTIVE",
                )
                .first()
            )
            if not membership:
                return None
        elif role != user.role:
            return None

        if role == "SUPER_ADMIN" and user.role != "SUPER_ADMIN":
            return None

        # Do not pass unverified, client-editable custom claims downstream.
        return {
            "sub": user.id,
            "userId": user.id,
            "email": user.email,
            "role": role,
            "organizationId": organization_id if role == "ORGANIZATION_ADMIN" else user.organization_id,
            "eventId": event_id,
            "name": user.name,
        }
    finally:
        db.close()


def can_subscribe_to_channel(claims: Dict[str, Any], channel: str) -> bool:
    """Allow only event-scoped attendance subscriptions to assigned operational roles."""
    parts = channel.split(":")
    if len(parts) != 3 or parts[0] != "attendance" or parts[2] != "live":
        return False

    event_id = parts[1]
    role = claims.get("role")
    user_id = claims.get("userId")
    if role not in ALLOWED_ATTENDANCE_ROLES or not event_id or not user_id:
        return False

    db: Session = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return False

        if role == "SUPER_ADMIN" and not claims.get("eventId"):
            return True

        if claims.get("eventId"):
            return claims.get("eventId") == event_id and role in ALLOWED_ATTENDANCE_ROLES

        if role == "ORGANIZATION_ADMIN":
            return bool(
                db.query(OrganizationMembership.id)
                .filter(
                    OrganizationMembership.user_id == user_id,
                    OrganizationMembership.organization_id == event.organization_id,
                    OrganizationMembership.role == "ORGANIZATION_ADMIN",
                    OrganizationMembership.status == "ACTIVE",
                )
                .first()
            )

        return bool(
            db.query(EventMember.id)
            .filter(
                EventMember.event_id == event_id,
                EventMember.user_id == user_id,
                EventMember.role == role,
                EventMember.status == "ACTIVE",
            )
            .first()
        )
    finally:
        db.close()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """Authenticated, event-scoped real-time WebSocket connection."""
    await websocket.accept()
    user_claims = validate_access_token(token) if token else None

    if not user_claims:
        if token:
            await websocket.send_text(json.dumps({
                "type": "AUTH_ERROR",
                "message": "A valid access token with an active assignment is required.",
            }))
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Support clients that authenticate with the first frame, but validate it
        # identically before registering the connection or processing subscriptions.
        try:
            auth_raw = await websocket.receive_text()
            auth_msg = json.loads(auth_raw)
            auth_token = auth_msg.get("token") if auth_msg.get("type") == "AUTH" else None
            if auth_token:
                user_claims = validate_access_token(auth_token)
        except (ValueError, TypeError):
            user_claims = None

        if not user_claims:
            await websocket.send_text(json.dumps({
                "type": "AUTH_ERROR",
                "message": "A valid access token with an active assignment is required.",
            }))
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect(websocket, user_claims, accept=False)
    await websocket.send_text(json.dumps({
        "type": "CONNECTED",
        "message": "Authenticated session established with EVENTOPS Real-Time Engine.",
        "user": user_claims.get("email"),
        "role": user_claims.get("role"),
        "eventId": user_claims.get("eventId"),
        "subscribedChannels": [],
    }))

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                mtype = message.get("type")

                if mtype == "SUBSCRIBE":
                    channel = message.get("channel")
                    if not isinstance(channel, str) or not can_subscribe_to_channel(user_claims, channel):
                        await websocket.send_text(json.dumps({
                            "type": "SUBSCRIBE_DENIED",
                            "message": "You are not authorized to subscribe to this channel.",
                        }))
                        continue
                    manager.subscribe(websocket, channel)
                    await websocket.send_text(json.dumps({"type": "SUBSCRIBED", "channel": channel}))

                elif mtype == "UNSUBSCRIBE":
                    channel = message.get("channel")
                    if isinstance(channel, str):
                        manager.unsubscribe(websocket, channel)
                        await websocket.send_text(json.dumps({"type": "UNSUBSCRIBED", "channel": channel}))

                elif mtype == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "ERROR", "message": "Invalid JSON frame."}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected.")
