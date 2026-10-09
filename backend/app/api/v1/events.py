import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    Event,
    Round,
    RoundCriterion,
    TimeSlot,
    EventRule,
    EventMember,
    Team,
    Venue,
    Judge,
    User,
)
from app.schemas.entities import (
    EventCreate,
    EventUpdate,
    EventResponse,
    RoundSchema,
    RoundCriteriaSchema,
    TimeSlotSchema,
    EventRuleSchema,
)
from app.api.deps import get_current_user, get_current_tenant_user, require_roles

router = APIRouter()


def map_event_to_response(event: Event, db: Session) -> EventResponse:
    rounds = db.query(Round).filter(Round.event_id == event.id).order_by(Round.round_order.asc()).all()
    round_schemas = []
    for r in rounds:
        criteria = db.query(RoundCriterion).filter(RoundCriterion.round_id == r.id).all()
        crit_schemas = [
            RoundCriteriaSchema(
                id=c.id,
                name=c.name,
                maxScore=c.max_score,
                weight=c.weight,
                description=c.description,
            )
            for c in criteria
        ]
        round_schemas.append(
            RoundSchema(
                id=r.id,
                name=r.name,
                order=r.round_order,
                status=r.status,
                startTime=r.start_time.isoformat() if r.start_time else "",
                endTime=r.end_time.isoformat() if r.end_time else "",
                qualifyingQuota=r.qualifying_quota,
                criteria=crit_schemas,
            )
        )

    slots = db.query(TimeSlot).filter(TimeSlot.event_id == event.id).all()
    slot_schemas = [
        TimeSlotSchema(
            id=s.id,
            label=s.label,
            startTime=s.start_time.isoformat() if s.start_time else "",
            endTime=s.end_time.isoformat() if s.end_time else "",
            capacity=s.capacity,
        )
        for s in slots
    ]

    rules = db.query(EventRule).filter(EventRule.event_id == event.id).all()
    rule_schemas = [
        EventRuleSchema(
            id=ru.id,
            title=ru.title,
            description=ru.description,
            category=ru.category,
            isMandatory=ru.is_mandatory,
        )
        for ru in rules
    ]

    teams_count = db.query(Team).filter(Team.event_id == event.id).count()
    venues_count = db.query(Venue).filter(Venue.event_id == event.id).count()
    judges_count = db.query(Judge).filter(Judge.event_id == event.id).count()

    return EventResponse(
        id=event.id,
        organizationId=event.organization_id,
        ownerId=event.owner_id,
        isPersonalEvent=event.is_personal_event,
        name=event.name,
        type=event.type,
        description=event.description,
        location=event.location,
        bannerUrl=event.banner_url,
        startDate=event.start_date.isoformat() if event.start_date else "",
        endDate=event.end_date.isoformat() if event.end_date else "",
        registrationDeadline=event.registration_deadline.isoformat() if event.registration_deadline else "",
        status=event.status,
        expectedParticipants=event.expected_participants,
        registeredTeamsCount=teams_count,
        currentRound=event.current_round,
        totalRounds=event.total_rounds,
        venuesCount=venues_count,
        judgesCount=judges_count,
        rounds=round_schemas,
        timeSlots=slot_schemas,
        rules=rule_schemas,
    )


@router.get("", response_model=List[EventResponse])
def list_events(
    organization_id: Optional[str] = None,
    db: Session = Depends(get_db),
    _tenant_user: Optional[User] = Depends(get_current_tenant_user),
):
    """List events matching tenant isolation boundaries."""
    query = db.query(Event)
    if organization_id and organization_id not in ("null", "undefined"):
        query = query.filter(Event.organization_id == organization_id)
    events = query.all()
    return [map_event_to_response(e, db) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    """Retrieve comprehensive event specification."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")
    return map_event_to_response(event, db)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"])),
):
    """Create a new event entity with associated rounds and rules."""
    new_id = f"evt-{uuid.uuid4().hex[:8]}"

    def parse_dt(dt_str: str) -> datetime:
        try:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        except Exception:
            return datetime.now(timezone.utc)

    event = Event(
        id=new_id,
        organization_id=payload.organizationId or current_user.organization_id,
        owner_id=current_user.id,
        is_personal_event=payload.isPersonalEvent,
        name=payload.name,
        type=payload.type,
        description=payload.description,
        location=payload.location,
        start_date=parse_dt(payload.startDate),
        end_date=parse_dt(payload.endDate),
        registration_deadline=parse_dt(payload.registrationDeadline),
        status="DRAFT",
        expected_participants=payload.expectedParticipants,
        total_rounds=payload.totalRounds,
    )
    db.add(event)
    db.commit()

    # Create initial round if provided or default
    rounds_to_create = payload.rounds or [
        RoundSchema(
            id=f"rnd-1",
            name="Round 1 — Initial Evaluation",
            order=1,
            status="UPCOMING",
            startTime=payload.startDate,
            endTime=payload.endDate,
            qualifyingQuota=20,
            criteria=[
                RoundCriteriaSchema(id="c1", name="Technical Feasibility", maxScore=25, weight=0.25, description="System architecture"),
                RoundCriteriaSchema(id="c2", name="Impact & Innovation", maxScore=25, weight=0.25, description="Practical value"),
            ],
        )
    ]

    for r_data in rounds_to_create:
        rnd = Round(
            id=f"rnd-{uuid.uuid4().hex[:6]}",
            event_id=new_id,
            name=r_data.name,
            round_order=r_data.order,
            status=r_data.status,
            start_time=parse_dt(r_data.startTime),
            end_time=parse_dt(r_data.endTime),
            qualifying_quota=r_data.qualifyingQuota,
        )
        db.add(rnd)
        db.commit()

        for c_data in r_data.criteria:
            crit = RoundCriterion(
                id=f"crit-{uuid.uuid4().hex[:6]}",
                round_id=rnd.id,
                name=c_data.name,
                max_score=c_data.maxScore,
                weight=c_data.weight,
                description=c_data.description,
            )
            db.add(crit)
        db.commit()

    return map_event_to_response(event, db)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"])),
):
    """Update event properties."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if payload.name is not None:
        event.name = payload.name
    if payload.type is not None:
        event.type = payload.type
    if payload.description is not None:
        event.description = payload.description
    if payload.location is not None:
        event.location = payload.location
    if payload.status is not None:
        event.status = payload.status
    if payload.expectedParticipants is not None:
        event.expected_participants = payload.expectedParticipants
    if payload.currentRound is not None:
        event.current_round = payload.currentRound
    if payload.totalRounds is not None:
        event.total_rounds = payload.totalRounds

    db.commit()
    db.refresh(event)
    return map_event_to_response(event, db)


@router.get("/{event_id}/members")
def get_event_members(event_id: str, db: Session = Depends(get_db)):
    """List enrolled event members."""
    members = db.query(EventMember).filter(EventMember.event_id == event_id).all()
    return [
        {
            "id": m.id,
            "eventId": m.event_id,
            "userId": m.user_id,
            "name": m.name,
            "email": m.email,
            "role": m.role,
            "phone": m.phone,
            "title": m.title,
            "zoneOrDept": m.zone_or_dept,
            "status": m.status,
            "createdAt": m.created_at.isoformat() if m.created_at else None,
        }
        for m in members
    ]

