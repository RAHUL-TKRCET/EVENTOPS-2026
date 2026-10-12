import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.events import manager as realtime_manager
from app.models.entities import Evaluation, Team, Judge, User, Round, Event
from app.schemas.entities import EvaluationCreate, EvaluationResponse
from app.api.deps import get_current_user
from app.api.v1.events import _active_role, _is_platform_admin, require_event_scope

router = APIRouter()


def _assigned_judge(db: Session, user: User, event_id: str) -> Judge:
    """Resolve a judge only for an active event-scoped JUDGE session."""
    if _active_role(user) != "JUDGE":
        raise HTTPException(status_code=403, detail="Only an authenticated judge can access scoring operations.")
    if getattr(user, "active_event_id", None) != event_id:
        raise HTTPException(status_code=403, detail="The judge session is not scoped to this event.")
    judge = db.query(Judge).filter(Judge.user_id == user.id, Judge.event_id == event_id).first()
    if not judge:
        raise HTTPException(status_code=403, detail="No judge assignment exists for this event.")
    return judge


def _judge_assigned_to_team(judge: Judge, team: Team) -> bool:
    return judge.id in (team.assigned_judges or []) or team.id in (judge.assigned_teams or [])


def _evaluation_response(record: Evaluation, team: Team | None = None) -> EvaluationResponse:
    return EvaluationResponse(
        id=record.id, eventId=record.event_id, roundId=record.round_id, judgeId=record.judge_id,
        teamId=record.team_id, teamName=team.name if team else None, scores=record.scores,
        totalScore=record.total_score, feedback=record.feedback, strengths=record.strengths,
        areasToImprove=record.areas_to_improve, status=record.status,
        submittedAt=record.submitted_at.isoformat() if record.submitted_at else "",
    )


@router.post("", response_model=EvaluationResponse, status_code=201)
async def submit_evaluation(
    payload: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a score only when the caller is an assigned judge for the event/team."""
    team = db.query(Team).filter(Team.id == payload.teamId).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if payload.eventId != team.event_id:
        raise HTTPException(status_code=403, detail="The requested event does not own this team.")

    judge = _assigned_judge(db, current_user, team.event_id)
    if not _judge_assigned_to_team(judge, team):
        raise HTTPException(status_code=403, detail="This judge is not assigned to score the selected team.")
    round_record = db.query(Round).filter(Round.id == payload.roundId, Round.event_id == team.event_id).first()
    if not round_record:
        raise HTTPException(status_code=404, detail="Round not found for this event.")

    scores = payload.scores
    total_score = round(sum(scores.values()), 2)
    record = db.query(Evaluation).filter(
        Evaluation.event_id == team.event_id,
        Evaluation.round_id == payload.roundId,
        Evaluation.judge_id == judge.id,
        Evaluation.team_id == team.id,
    ).first()

    now = datetime.now(timezone.utc)
    if record:
        record.scores = scores
        record.total_score = total_score
        record.feedback = payload.feedback
        record.strengths = payload.strengths
        record.areas_to_improve = payload.areasToImprove
        record.status = payload.status
        record.submitted_at = now
    else:
        record = Evaluation(
            id=f"eval-{uuid.uuid4().hex[:8]}", event_id=team.event_id, round_id=payload.roundId,
            judge_id=judge.id, team_id=team.id, scores=scores, total_score=total_score,
            feedback=payload.feedback, strengths=payload.strengths, areas_to_improve=payload.areasToImprove,
            status=payload.status, submitted_at=now,
        )
        db.add(record)
    db.commit()

    team_evaluations = db.query(Evaluation).filter(Evaluation.team_id == team.id).all()
    team.total_score = round(sum(item.total_score for item in team_evaluations) / len(team_evaluations), 2) if team_evaluations else 0.0
    db.commit()

    await realtime_manager.broadcast("evaluation:live", {
        "type": "SCORECARD_SUBMITTED", "eventId": team.event_id, "teamId": team.id, "teamName": team.name,
        "roundId": payload.roundId, "totalScore": total_score, "timestamp": now.isoformat(),
    })
    return _evaluation_response(record, team)


@router.get("/team/{team_id}/mine", response_model=Optional[EvaluationResponse])
def get_my_team_evaluation(
    team_id: str,
    roundId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return only this authenticated judge's own scorecard for an assigned team and round."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    judge = _assigned_judge(db, current_user, team.event_id)
    if not _judge_assigned_to_team(judge, team):
        raise HTTPException(status_code=403, detail="This judge is not assigned to score the selected team.")

    round_record = db.query(Round).filter(
        Round.id == roundId,
        Round.event_id == team.event_id,
    ).first()
    if not round_record:
        raise HTTPException(status_code=404, detail="Round not found for this event.")

    record = db.query(Evaluation).filter(
        Evaluation.event_id == team.event_id,
        Evaluation.round_id == roundId,
        Evaluation.judge_id == judge.id,
        Evaluation.team_id == team.id,
    ).first()
    return _evaluation_response(record, team) if record else None


@router.get("/team/{team_id}", response_model=List[EvaluationResponse])
def get_team_evaluations(
    team_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Retrieve scorecards only for permitted event users or an assigned judge."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if _active_role(current_user) == "JUDGE":
        judge = _assigned_judge(db, current_user, team.event_id)
        if not _judge_assigned_to_team(judge, team):
            raise HTTPException(status_code=403, detail="This judge is not assigned to the selected team.")
    else:
        event = db.query(Event).filter(Event.id == team.event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found.")
        require_event_scope(event, current_user)

    records = db.query(Evaluation).filter(Evaluation.team_id == team.id).all()
    return [_evaluation_response(item, team) for item in records]


@router.get("/mine", response_model=List[EvaluationResponse])
def get_my_evaluations(
    eventId: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return only scorecards submitted by this judge in their active event."""
    active_event_id = getattr(current_user, "active_event_id", None)
    if not active_event_id:
        raise HTTPException(status_code=403, detail="An active event-scoped judge session is required.")

    if eventId and eventId != active_event_id:
        raise HTTPException(status_code=403, detail="Evaluation history is restricted to the active event.")

    judge = _assigned_judge(db, current_user, active_event_id)
    records = (
        db.query(Evaluation)
        .filter(
            Evaluation.event_id == active_event_id,
            Evaluation.judge_id == judge.id,
        )
        .order_by(Evaluation.submitted_at.desc())
        .all()
    )
    team_ids = list({record.team_id for record in records})
    team_rows = (
        db.query(Team)
        .filter(Team.event_id == active_event_id, Team.id.in_(team_ids))
        .all()
        if team_ids
        else []
    )
    teams_by_id = {team.id: team for team in team_rows}
    return [_evaluation_response(record, teams_by_id.get(record.team_id)) for record in records]


@router.get("/leaderboard/{event_id}")
def get_leaderboard(
    event_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Read leaderboard only for the event authorized by the current session."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, current_user)
    teams = db.query(Team).filter(Team.event_id == event_id).order_by(Team.total_score.desc()).all()
    results = []
    for rank, team in enumerate(teams, start=1):
        team.rank = rank
        results.append({
            "rank": rank, "teamId": team.id, "teamName": team.name, "domain": team.project_domain,
            "totalScore": team.total_score, "checkInStatus": team.check_in_status,
        })
    db.commit()
    return results
