import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    Event,
    Organization,
    Round,
    RoundCriterion,
    TimeSlot,
    EventRule,
    EventMember,
    Team,
    TeamMember,
    Venue,
    Bench,
    Judge,
    Evaluation,
    AttendanceRecord,
    AllocationConstraint,
    AllocationResult,
    Volunteer,
    VolunteerTask,
    Resource,
    ResourceDistribution,
    Incident,
    AuditLog,
    Invitation,
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
    PublicEventResponse,
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


def _active_role(user: User) -> str:
    return getattr(user, "active_role", user.role)


def _is_platform_admin(user: User) -> bool:
    return _active_role(user) == "SUPER_ADMIN" and not getattr(user, "active_event_id", None)


def _resolve_event_rounds(payload: EventCreate) -> tuple[int, List[RoundSchema]]:
    """Keep the event's declared round count aligned with its persisted round records."""
    if payload.rounds:
        return len(payload.rounds), payload.rounds

    default_round_names = ["Screening", "Prototype Demo", "Jury Grand Finale"]
    round_count = max(1, payload.totalRounds)
    default_criteria = [
        RoundCriteriaSchema(
            id="c1",
            name="Technical Feasibility",
            maxScore=25,
            weight=0.25,
            description="System architecture",
        ),
        RoundCriteriaSchema(
            id="c2",
            name="Impact & Innovation",
            maxScore=25,
            weight=0.25,
            description="Practical value",
        ),
    ]
    rounds = [
        RoundSchema(
            id=f"rnd-default-{index}",
            name=(
                default_round_names[index - 1]
                if index <= len(default_round_names)
                else f"Round {index}"
            ),
            order=index,
            status="UPCOMING",
            startTime=payload.startDate,
            endTime=payload.endDate,
            qualifyingQuota=20,
            criteria=default_criteria,
        )
        for index in range(1, round_count + 1)
    ]
    return round_count, rounds


def require_event_scope(event: Event, user: User) -> None:
    """Authorize event access from the verified principal, not client-supplied tenant headers."""
    role = _active_role(user)
    event_scope = getattr(user, "active_event_id", None)
    org_scope = getattr(user, "active_organization_id", None) or user.organization_id

    if _is_platform_admin(user):
        return
    if event_scope:
        if event_scope != event.id or org_scope != event.organization_id:
            raise HTTPException(status_code=403, detail="Event access denied.")
        return
    if role == "ORGANIZATION_ADMIN":
        if not org_scope or event.organization_id != org_scope:
            raise HTTPException(status_code=403, detail="Cross-organization event access denied.")
        return
    if role == "EVENT_ADMIN":
        if event.owner_id != user.id:
            raise HTTPException(status_code=403, detail="Event access denied.")
        return
    raise HTTPException(status_code=403, detail="This role cannot administer event data.")


@router.get("", response_model=List[EventResponse])
def list_events(
    organization_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List only events inside the authenticated user's authorized scope."""
    role = _active_role(current_user)
    event_scope = getattr(current_user, "active_event_id", None)
    org_scope = getattr(current_user, "active_organization_id", None) or current_user.organization_id
    query = db.query(Event)

    if _is_platform_admin(current_user):
        if organization_id and organization_id not in ("null", "undefined"):
            if not db.query(Organization).filter(Organization.id == organization_id).first():
                raise HTTPException(status_code=404, detail="Organization not found.")
            query = query.filter(Event.organization_id == organization_id)
    elif event_scope:
        if organization_id and organization_id != org_scope:
            raise HTTPException(status_code=403, detail="Cross-organization event access denied.")
        query = query.filter(Event.id == event_scope)
    elif role == "ORGANIZATION_ADMIN":
        if not org_scope:
            raise HTTPException(status_code=403, detail="An organization context is required.")
        if organization_id and organization_id != org_scope:
            raise HTTPException(status_code=403, detail="Cross-organization event access denied.")
        query = query.filter(Event.organization_id == org_scope)
    elif role == "EVENT_ADMIN":
        if organization_id and organization_id != org_scope:
            raise HTTPException(status_code=403, detail="Cross-organization event access denied.")
        query = query.filter(Event.owner_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="This role cannot list administrative event data.")

    return [map_event_to_response(e, db) for e in query.all()]


@router.get("/{event_id}/public", response_model=PublicEventResponse)
def get_public_event(event_id: str, db: Session = Depends(get_db)):
    """Return only approved event metadata for the unauthenticated public portal."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    return PublicEventResponse(
        id=event.id,
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
        currentRound=event.current_round,
        totalRounds=event.total_rounds,
    )


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve comprehensive event specification after scope validation."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, current_user)
    return map_event_to_response(event, db)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN"])),
):
    """Create an event in the caller's tenant; only Super Admin can pick a tenant."""
    if _is_platform_admin(current_user):
        organization_id = payload.organizationId
        if organization_id and not db.query(Organization).filter(Organization.id == organization_id).first():
            raise HTTPException(status_code=404, detail="Organization not found.")
    else:
        organization_id = getattr(current_user, "active_organization_id", None) or current_user.organization_id
        if not organization_id:
            raise HTTPException(status_code=403, detail="An organization context is required.")
        if payload.organizationId and payload.organizationId != organization_id:
            raise HTTPException(status_code=403, detail="An organization administrator cannot create events for another organization.")

    def parse_dt(dt_str: str) -> datetime:
        try:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError) as exc:
            raise HTTPException(status_code=422, detail="Event dates must be valid ISO-8601 timestamps.") from exc

    new_id = f"evt-{uuid.uuid4().hex[:8]}"
    round_count, rounds_to_create = _resolve_event_rounds(payload)
    event = Event(
        id=new_id, organization_id=organization_id, owner_id=current_user.id,
        is_personal_event=payload.isPersonalEvent, name=payload.name, type=payload.type,
        description=payload.description, location=payload.location,
        start_date=parse_dt(payload.startDate), end_date=parse_dt(payload.endDate),
        registration_deadline=parse_dt(payload.registrationDeadline),
        status="DRAFT", expected_participants=payload.expectedParticipants, total_rounds=round_count,
    )
    db.add(event)
    try:
        db.flush()

        for round_data in rounds_to_create:
            round_record = Round(
                id=f"rnd-{uuid.uuid4().hex[:6]}", event_id=new_id, name=round_data.name,
                round_order=round_data.order, status=round_data.status,
                start_time=parse_dt(round_data.startTime), end_time=parse_dt(round_data.endTime),
                qualifying_quota=round_data.qualifyingQuota,
            )
            db.add(round_record)
            db.flush()
            for criterion in round_data.criteria:
                db.add(RoundCriterion(
                    id=f"crit-{uuid.uuid4().hex[:6]}", round_id=round_record.id, name=criterion.name,
                    max_score=criterion.maxScore, weight=criterion.weight, description=criterion.description,
                ))
        for slot in payload.timeSlots or []:
            db.add(TimeSlot(
                id=f"slot-{uuid.uuid4().hex[:6]}", event_id=new_id, round_id=None, label=slot.label,
                start_time=parse_dt(slot.startTime), end_time=parse_dt(slot.endTime), capacity=slot.capacity,
            ))
        for rule in payload.rules or []:
            db.add(EventRule(
                id=f"rule-{uuid.uuid4().hex[:6]}", event_id=new_id, title=rule.title, description=rule.description,
                category=rule.category, is_mandatory=rule.isMandatory,
            ))
        db.commit()
        db.refresh(event)
    except Exception:
        db.rollback()
        raise
    return map_event_to_response(event, db)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"])),
):
    """Update event properties only after checking verified tenant/event ownership."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, current_user)

    if payload.name is not None:
        event.name = payload.name
    if payload.type is not None:
        event.type = payload.type
    if payload.description is not None:
        event.description = payload.description
    if payload.location is not None:
        event.location = payload.location
    if payload.status is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event status cannot be changed through the general update endpoint. Use the dedicated lifecycle action.",
        )
    if payload.expectedParticipants is not None:
        event.expected_participants = payload.expectedParticipants
    if payload.currentRound is not None:
        event.current_round = payload.currentRound
    if payload.totalRounds is not None:
        event.total_rounds = payload.totalRounds

    db.commit()
    db.refresh(event)
    return map_event_to_response(event, db)


@router.post("/{event_id}/publish", response_model=EventResponse)
def publish_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN"])),
):
    """Publish a draft only after verifying its tenant scope and public readiness."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, current_user)

    current_status = (event.status or "DRAFT").strip().upper()
    if current_status == "PUBLISHED":
        return map_event_to_response(event, db)
    if current_status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only draft events can be published. Current status: {current_status}.",
        )

    problems = []
    if not (event.name or "").strip():
        problems.append("Event name is required.")
    if not (event.type or "").strip():
        problems.append("Event type is required.")
    if not (event.description or "").strip():
        problems.append("Add a public event description before publishing.")
    if not (event.location or "").strip():
        problems.append("Add an event location before publishing.")
    if not event.start_date or not event.end_date:
        problems.append("Start and end dates are required.")
    if not event.registration_deadline:
        problems.append("A registration deadline is required.")

    def utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    if event.start_date and event.end_date and utc(event.start_date) >= utc(event.end_date):
        problems.append("The event end date and time must be after the start.")
    if event.start_date and event.registration_deadline and utc(event.registration_deadline) > utc(event.start_date):
        problems.append("The registration deadline must be on or before the event start.")

    if problems:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "This draft is not ready to publish.", "problems": problems},
        )

    event.status = "PUBLISHED"
    db.commit()
    db.refresh(event)
    return map_event_to_response(event, db)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN"])),
):
    """Delete an unused draft while preserving audit history and guarding operational records."""
    event = db.query(Event).filter(Event.id == event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, current_user)

    current_status = (event.status or "DRAFT").strip().upper()
    if current_status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft events can be permanently deleted. Published or operational events must use an approved archive/cancellation workflow.",
        )

    # Only operational/participation records block deletion. Drafts are commonly
    # created with default rounds/rules and may have non-operational audit entries.
    blocking_models = (
        EventMember, Team, Judge, Evaluation, AttendanceRecord, AllocationResult,
        Volunteer, VolunteerTask, ResourceDistribution, Incident,
    )
    dependencies = [
        model.__tablename__
        for model in blocking_models
        if db.query(model).filter(model.event_id == event_id).first() is not None
    ]
    if dependencies:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "This draft cannot be deleted because participant or operational history exists.",
                "dependencies": dependencies,
                "nextStep": "Keep the event and use an approved archive/cancellation workflow if it should no longer be active.",
            },
        )

    now = datetime.now(timezone.utc)
    try:
        # Pending event invitations become revoked before the draft is removed.
        event_invitations = db.query(Invitation).filter(Invitation.event_id == event_id).all()
        for invitation in event_invitations:
            if (invitation.status or "").upper() not in {"REVOKED", "EXPIRED"}:
                invitation.status = "REVOKED"
                invitation.revoked_at = now
            db.add(AuditLog(
                organization_id=event.organization_id,
                event_id=event.id,
                user_id=current_user.id,
                user_role=getattr(current_user, "active_role", current_user.role),
                action="DRAFT_INVITATION_REVOKED",
                resource_type="Invitation",
                resource_id=invitation.id,
                metadata_json={"reason": "parent draft deleted"},
            ))

        # Record the deletion while preserving audit rows (audit_logs.event_id is
        # not a foreign key, so these entries survive removal of the event).
        db.add(AuditLog(
            organization_id=event.organization_id,
            event_id=event.id,
            user_id=current_user.id,
            user_role=getattr(current_user, "active_role", current_user.role),
            action="DRAFT_EVENT_DELETED",
            resource_type="Event",
            resource_id=event.id,
            metadata_json={"reason": "unused draft deletion"},
        ))
        db.flush()

        # Remove revoked invitations explicitly as some test/dev SQLite setups
        # run without FK cascade enforcement; their revocation audit rows remain.
        db.query(Invitation).filter(Invitation.event_id == event_id).delete(synchronize_session=False)

        # Explicitly remove draft-only configuration so default-created rounds,
        # criteria, schedules, venues/benches, rules and constraints don't make a
        # brand-new draft undeletable. Operational records were guarded above.
        round_ids = [row.id for row in db.query(Round.id).filter(Round.event_id == event_id).all()]
        if round_ids:
            db.query(RoundCriterion).filter(RoundCriterion.round_id.in_(round_ids)).delete(synchronize_session=False)
        venue_ids = [row.id for row in db.query(Venue.id).filter(Venue.event_id == event_id).all()]
        if venue_ids:
            db.query(Bench).filter(Bench.venue_id.in_(venue_ids)).delete(synchronize_session=False)
        team_ids = [row.id for row in db.query(Team.id).filter(Team.event_id == event_id).all()]
        if team_ids:
            db.query(TeamMember).filter(TeamMember.team_id.in_(team_ids)).delete(synchronize_session=False)
        db.query(TimeSlot).filter(TimeSlot.event_id == event_id).delete(synchronize_session=False)
        db.query(EventRule).filter(EventRule.event_id == event_id).delete(synchronize_session=False)
        db.query(Venue).filter(Venue.event_id == event_id).delete(synchronize_session=False)
        db.query(Round).filter(Round.event_id == event_id).delete(synchronize_session=False)
        db.query(AllocationConstraint).filter(AllocationConstraint.event_id == event_id).delete(synchronize_session=False)
        db.query(Resource).filter(Resource.event_id == event_id).delete(synchronize_session=False)
        db.query(ResourceDistribution).filter(ResourceDistribution.event_id == event_id).delete(synchronize_session=False)
        db.query(VolunteerTask).filter(VolunteerTask.event_id == event_id).delete(synchronize_session=False)
        db.query(Volunteer).filter(Volunteer.event_id == event_id).delete(synchronize_session=False)
        db.query(Judge).filter(Judge.event_id == event_id).delete(synchronize_session=False)

        # Deletion audit must remain and therefore is deliberately not removed.
        db.delete(event)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return None


@router.get("/{event_id}/members")
def get_event_members(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List enrolled event members only within verified scope."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, current_user)
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

