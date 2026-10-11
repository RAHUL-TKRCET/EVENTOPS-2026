import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.events import _active_role, _is_platform_admin, require_event_scope
from app.core.database import get_db
from app.models.entities import Event, Judge, Team, User
from app.schemas.entities import JudgeCreate, JudgeResponse, JudgeUpdate

router = APIRouter()
ALLOWED_WORKLOAD = {"AVAILABLE", "BUSY", "OVERLOADED", "UNAVAILABLE"}


def _to_response(judge: Judge) -> JudgeResponse:
    return JudgeResponse(
        id=judge.id,
        eventId=judge.event_id,
        userId=judge.user_id,
        name=judge.name,
        email=judge.email,
        organization=judge.organization,
        designation=judge.title,
        expertise=list(judge.domains or []),
        domains=list(judge.domains or []),
        assignedTeams=list(judge.assigned_teams or []),
        workloadStatus=judge.workload_status or "AVAILABLE",
        maxTeamCapacity=judge.max_teams or 10,
        invitationStatus="ENROLLED" if judge.user_id else "PENDING_ACCOUNT",
        emailDelivery="NOT_CONFIGURED",
    )


def _load_event_for_admin(db: Session, event_id: str, actor: User) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, actor)
    if _active_role(actor) not in {"ORGANIZATION_ADMIN", "EVENT_ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="This role cannot manage judge enrollment.")
    return event


def _can_manage_judge(actor: User) -> bool:
    return _active_role(actor) in {"ORGANIZATION_ADMIN", "EVENT_ADMIN", "SUPER_ADMIN"}


@router.get("", response_model=List[JudgeResponse])
def list_judges(
    eventId: Optional[str] = None,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    if not _can_manage_judge(actor):
        raise HTTPException(status_code=403, detail="This role cannot view judge administration.")
    if eventId:
        event = _load_event_for_admin(db, eventId, actor)
        rows = db.query(Judge).filter(Judge.event_id == event.id).order_by(Judge.created_at.desc()).all()
        return [_to_response(row) for row in rows]
    if _is_platform_admin(actor):
        rows = db.query(Judge).order_by(Judge.created_at.desc()).limit(500).all()
        return [_to_response(row) for row in rows]

    organization_id = getattr(actor, "active_organization_id", None) or actor.organization_id
    if not organization_id:
        raise HTTPException(status_code=403, detail="An organization context is required.")
    event_ids = db.query(Event.id).filter(Event.organization_id == organization_id).subquery()
    rows = db.query(Judge).filter(Judge.event_id.in_(event_ids)).order_by(Judge.created_at.desc()).limit(500).all()
    return [_to_response(row) for row in rows]


@router.post("", response_model=JudgeResponse, status_code=201)
def create_judge(
    payload: JudgeCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    event = _load_event_for_admin(db, payload.eventId, actor)
    email = str(payload.email).strip().lower()
    duplicate = db.query(Judge).filter(Judge.event_id == event.id, Judge.email.ilike(email)).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="A judge with this email is already enrolled for this event.")

    workload = payload.workloadStatus.upper()
    if workload not in ALLOWED_WORKLOAD:
        raise HTTPException(status_code=422, detail="Invalid judge workload status.")
    domains = list(dict.fromkeys(item.strip() for item in payload.domains if item.strip()))
    assigned_teams = list(dict.fromkeys(payload.assignedTeams))
    if assigned_teams:
        valid_ids = {
            row[0] for row in db.query(Team.id).filter(
                Team.event_id == event.id, Team.id.in_(assigned_teams)
            ).all()
        }
        if valid_ids != set(assigned_teams):
            raise HTTPException(status_code=422, detail="Every assigned team must belong to the selected event.")

    # No mail provider or secure invitation-token storage is configured in this service.
    # Persist an enrollment as pending, and report delivery state honestly instead of fabricating an invite.
    judge = Judge(
        id=f"judge-{uuid.uuid4().hex[:12]}",
        event_id=event.id,
        user_id=None,
        name=payload.name.strip(),
        email=email,
        organization=payload.organization,
        title=payload.title,
        domains=domains,
        assigned_teams=assigned_teams,
        workload_status=workload,
        max_teams=payload.maxTeams,
    )
    db.add(judge)
    db.commit()
    db.refresh(judge)
    return _to_response(judge)


@router.get("/{judge_id}", response_model=JudgeResponse)
def get_judge(judge_id: str, db: Session = Depends(get_db), actor: User = Depends(get_current_user)):
    judge = db.query(Judge).filter(Judge.id == judge_id).first()
    if not judge:
        raise HTTPException(status_code=404, detail="Judge not found.")
    _load_event_for_admin(db, judge.event_id, actor)
    return _to_response(judge)


@router.patch("/{judge_id}", response_model=JudgeResponse)
def update_judge(
    judge_id: str,
    payload: JudgeUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    judge = db.query(Judge).filter(Judge.id == judge_id).first()
    if not judge:
        raise HTTPException(status_code=404, detail="Judge not found.")
    _load_event_for_admin(db, judge.event_id, actor)

    if payload.workloadStatus is not None and payload.workloadStatus.upper() not in ALLOWED_WORKLOAD:
        raise HTTPException(status_code=422, detail="Invalid judge workload status.")
    for field, column in (
        ("name", "name"), ("organization", "organization"), ("title", "title"),
        ("domains", "domains"), ("maxTeams", "max_teams"), ("workloadStatus", "workload_status"),
    ):
        value = getattr(payload, field)
        if value is not None:
            setattr(judge, column, value.upper() if field == "workloadStatus" else value)
    db.commit()
    db.refresh(judge)
    return _to_response(judge)


@router.put("/{judge_id}/assignments", response_model=JudgeResponse)
def assign_judge(
    judge_id: str,
    assignedTeams: List[str],
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    judge = db.query(Judge).filter(Judge.id == judge_id).first()
    if not judge:
        raise HTTPException(status_code=404, detail="Judge not found.")
    event = _load_event_for_admin(db, judge.event_id, actor)
    unique_team_ids = list(dict.fromkeys(assignedTeams))
    if len(unique_team_ids) > judge.max_teams:
        raise HTTPException(status_code=422, detail="The requested teams exceed this judge's configured capacity.")
    valid_team_ids = {
        row[0] for row in db.query(Team.id).filter(
            Team.event_id == event.id, Team.id.in_(unique_team_ids)
        ).all()
    } if unique_team_ids else set()
    if valid_team_ids != set(unique_team_ids):
        raise HTTPException(status_code=422, detail="Every assigned team must belong to the judge's event.")
    judge.assigned_teams = unique_team_ids
    db.commit()
    db.refresh(judge)
    return _to_response(judge)
