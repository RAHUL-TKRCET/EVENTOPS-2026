import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.events import manager as realtime_manager
from app.models.entities import Evaluation, Team, Judge, User, Round
from app.api.event_access import ensure_event_access, ensure_team_scope, get_event_or_404
from app.schemas.entities import EvaluationCreate, EvaluationResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.post("", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
async def submit_evaluation(
    payload: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit multi-criteria scoring rubric for an assigned team."""
    team = db.query(Team).filter(Team.id == payload.teamId).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team.event_id != payload.eventId:
        raise HTTPException(status_code=403, detail="The team does not belong to the requested event.")

    event = get_event_or_404(team.event_id, db)
    ensure_event_access(event, current_user, db, required_roles={"JUDGE"})
    ensure_team_scope(team, current_user, db)

    round_record = db.query(Round).filter(Round.id == payload.roundId).first()
    if not round_record or round_record.event_id != team.event_id:
        raise HTTPException(status_code=404, detail="Evaluation round not found for this event.")

    # Bind scoring to the persisted judge record matching the authenticated
    # event member, rather than trusting a client-provided judge identifier.
    judge = (
        db.query(Judge)
        .filter(Judge.event_id == team.event_id, Judge.email.ilike(current_user.email))
        .first()
    )
    if not judge:
        raise HTTPException(status_code=403, detail="No judge assignment is linked to this account.")
    judge_id = judge.id

    # Compute total score
    scores = payload.scores
    total_score = round(sum(scores.values()), 2)

    eval_record = (
        db.query(Evaluation)
        .filter(
            Evaluation.round_id == payload.roundId,
            Evaluation.judge_id == judge_id,
            Evaluation.team_id == payload.teamId,
        )
        .first()
    )

    now = datetime.now(timezone.utc)
    if eval_record:
        eval_record.scores = scores
        eval_record.total_score = total_score
        eval_record.feedback = payload.feedback
        eval_record.strengths = payload.strengths
        eval_record.areas_to_improve = payload.areasToImprove
        eval_record.submitted_at = now
    else:
        eval_record = Evaluation(
            id=f"eval-{uuid.uuid4().hex[:8]}",
            event_id=payload.eventId,
            round_id=payload.roundId,
            judge_id=judge_id,
            team_id=payload.teamId,
            scores=scores,
            total_score=total_score,
            feedback=payload.feedback,
            strengths=payload.strengths,
            areas_to_improve=payload.areasToImprove,
            status=payload.status,
            submitted_at=now,
        )
        db.add(eval_record)

    db.commit()

    # Recalculate team total score & ranks across all evaluations
    team_evals = db.query(Evaluation).filter(Evaluation.team_id == payload.teamId).all()
    avg_score = round(sum(e.total_score for e in team_evals) / len(team_evals), 2)
    team.total_score = avg_score
    db.commit()

    # Broadcast evaluation update over WebSockets
    await realtime_manager.broadcast("evaluation:live", {
        "type": "SCORECARD_SUBMITTED",
        "teamId": team.id,
        "teamName": team.name,
        "roundId": payload.roundId,
        "totalScore": total_score,
        "timestamp": now.isoformat(),
    })

    return EvaluationResponse(
        id=eval_record.id,
        eventId=eval_record.event_id,
        roundId=eval_record.round_id,
        judgeId=eval_record.judge_id,
        teamId=eval_record.team_id,
        teamName=team.name,
        scores=eval_record.scores,
        totalScore=eval_record.total_score,
        feedback=eval_record.feedback,
        strengths=eval_record.strengths,
        areasToImprove=eval_record.areas_to_improve,
        status=eval_record.status,
        submittedAt=eval_record.submitted_at.isoformat() if eval_record.submitted_at else "",
    )


@router.get("/team/{team_id}", response_model=List[EvaluationResponse])
def get_team_evaluations(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve scorecards only for a team visible to the current event member."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    ensure_team_scope(team, current_user, db)
    evals = db.query(Evaluation).filter(Evaluation.team_id == team_id).all()
    return [
        EvaluationResponse(
            id=e.id,
            eventId=e.event_id,
            roundId=e.round_id,
            judgeId=e.judge_id,
            teamId=e.team_id,
            teamName=team.name if team else None,
            scores=e.scores,
            totalScore=e.total_score,
            feedback=e.feedback,
            strengths=e.strengths,
            areasToImprove=e.areas_to_improve,
            status=e.status,
            submittedAt=e.submitted_at.isoformat() if e.submitted_at else "",
        )
        for e in evals
    ]


@router.get("/leaderboard/{event_id}")
def get_leaderboard(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compute a leaderboard only for an authorized event member."""
    event = get_event_or_404(event_id, db)
    ensure_event_access(event, current_user, db)
    teams = db.query(Team).filter(Team.event_id == event_id).order_by(Team.total_score.desc()).all()
    results = []
    for rank, t in enumerate(teams, start=1):
        t.rank = rank
        results.append({
            "rank": rank,
            "teamId": t.id,
            "teamName": t.name,
            "domain": t.project_domain,
            "totalScore": t.total_score,
            "checkInStatus": t.check_in_status,
        })
    db.commit()
    return results

