"""Unauthenticated, published-only event discovery for participant registration."""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Event
from app.schemas.entities import PublicEventResponse

router = APIRouter()


@router.get("", response_model=List[PublicEventResponse])
def list_public_events(db: Session = Depends(get_db)):
    """List published events using only approved public fields."""
    now = datetime.now(timezone.utc)
    events = (
        db.query(Event)
        .filter(Event.status.ilike("PUBLISHED"))
        .order_by(Event.start_date.asc())
        .all()
    )
    result = []
    for event in events:
        deadline = event.registration_deadline
        if deadline and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        # A public event catalogue may display published events; registration
        # availability itself is still enforced by the registration endpoint.
        result.append(PublicEventResponse(
            id=event.id,
            name=event.name,
            type=event.type,
            description=event.description,
            location=event.location,
            bannerUrl=event.banner_url,
            startDate=event.start_date.isoformat() if event.start_date else "",
            endDate=event.end_date.isoformat() if event.end_date else "",
            registrationDeadline=deadline.isoformat() if deadline else "",
            status=event.status,
            expectedParticipants=event.expected_participants,
            currentRound=event.current_round,
            totalRounds=event.total_rounds,
        ))
    return result
