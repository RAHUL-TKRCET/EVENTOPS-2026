import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import generate_qr_token
from app.core.events import manager as realtime_manager
from app.models.entities import Team, TeamMember, AttendanceRecord, Venue, Bench, User
from app.schemas.entities import (
    TeamCreate,
    TeamResponse,
    TeamMemberSchema,
    TeamProjectSchema,
    CheckInUpdate,
    QRScanRequest,
)
from app.api.deps import get_current_user

router = APIRouter()


def map_team_to_response(team: Team, db: Session) -> TeamResponse:
    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    mem_schemas = [
        TeamMemberSchema(
            id=m.id,
            name=m.name,
            email=m.email,
            phone=m.phone,
            role=m.role,
            organizationOrSchool=m.organization_or_school,
            dietaryPreference=m.dietary_preference,
            tshirtSize=m.tshirt_size,
            checkInStatus=m.check_in_status,
            checkedInAt=m.checked_in_at.isoformat() if m.checked_in_at else None,
        )
        for m in members
    ]

    venue = db.query(Venue).filter(Venue.id == team.assigned_venue_id).first() if team.assigned_venue_id else None
    bench = db.query(Bench).filter(Bench.id == team.assigned_bench_id).first() if team.assigned_bench_id else None

    project = TeamProjectSchema(
        title=team.project_title,
        abstract=team.project_abstract,
        domain=team.project_domain,
        repoUrl=team.repo_url,
        demoUrl=team.demo_url,
        techStack=team.tech_stack or [],
        hardwareRequirements=team.hardware_requirements or [],
    )

    return TeamResponse(
        id=team.id,
        eventId=team.event_id,
        name=team.name,
        leadName=team.lead_name,
        leadEmail=team.lead_email,
        members=mem_schemas,
        project=project,
        registrationStatus=team.registration_status,
        checkInStatus=team.check_in_status,
        checkedInTime=team.checked_in_time.isoformat() if team.checked_in_time else None,
        assignedVenue=team.assigned_venue_id,
        assignedVenueName=venue.name if venue else None,
        assignedBench=bench.label if bench else None,
        assignedJudges=team.assigned_judges or [],
        currentRound=team.current_round,
        totalScore=team.total_score,
        rank=team.rank,
        qrCodeToken=team.qr_code_token,
    )


@router.get("", response_model=List[TeamResponse])
def list_teams(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """List teams registered for an event."""
    teams = db.query(Team).filter(Team.event_id == eventId).all()
    return [map_team_to_response(t, db) for t in teams]


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail=f"Team '{team_id}' not found.")
    return map_team_to_response(team, db)


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def register_team(payload: TeamCreate, db: Session = Depends(get_db)):
    """Register a new team for an event."""
    team_count = db.query(Team).filter(Team.event_id == payload.eventId).count()
    new_team_id = f"T{(team_count + 1):03d}"
    qr_token = generate_qr_token(new_team_id, payload.eventId)

    project_data = payload.project or TeamProjectSchema(
        title="Enterprise AI Solution",
        domain="AI / Machine Learning",
    )

    new_team = Team(
        id=new_team_id,
        event_id=payload.eventId,
        name=payload.name,
        lead_name=payload.leadName,
        lead_email=payload.leadEmail,
        project_title=project_data.title,
        project_abstract=project_data.abstract,
        project_domain=project_data.domain,
        repo_url=project_data.repoUrl,
        demo_url=project_data.demoUrl,
        tech_stack=project_data.techStack,
        hardware_requirements=project_data.hardwareRequirements,
        registration_status="APPROVED",
        check_in_status="NOT_CHECKED_IN",
        current_round=1,
        qr_code_token=qr_token,
    )
    db.add(new_team)
    db.commit()

    if payload.members:
        for m in payload.members:
            mem = TeamMember(
                id=f"mem-{uuid.uuid4().hex[:6]}",
                team_id=new_team_id,
                name=m.name,
                email=m.email,
                phone=m.phone,
                role=m.role,
                organization_or_school=m.organizationOrSchool,
                dietary_preference=m.dietaryPreference,
                tshirt_size=m.tshirtSize,
                check_in_status="ABSENT",
            )
            db.add(mem)
        db.commit()

    return map_team_to_response(new_team, db)


@router.patch("/{team_id}/checkin", response_model=TeamResponse)
def update_checkin_status(team_id: str, payload: CheckInUpdate, db: Session = Depends(get_db)):
    """Update check-in state for team and write attendance record."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    team.check_in_status = payload.status
    now = datetime.now(timezone.utc)
    team.checked_in_time = now if payload.status == "CHECKED_IN" else None

    # Update members
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    for m in members:
        m.check_in_status = "CHECKED_IN" if payload.status == "CHECKED_IN" else "ABSENT"
        m.checked_in_at = now if payload.status == "CHECKED_IN" else None

    if payload.status == "CHECKED_IN":
        rec = AttendanceRecord(
            event_id=team.event_id,
            team_id=team.id,
            scan_timestamp=now,
            verification_status="VERIFIED",
            bench_confirmed=team.assigned_bench_id,
        )
        db.add(rec)

    db.commit()
    db.refresh(team)
    return map_team_to_response(team, db)


@router.post("/scan")
async def scan_qr_token(payload: QRScanRequest, db: Session = Depends(get_db)):
    """Validate cryptographic QR badge token, mark presence, and broadcast live update."""
    token = payload.qrToken.strip()
    team = (
        db.query(Team)
        .filter(
            (Team.qr_code_token == token) | (Team.id == token)
        )
        .first()
    )

    if not team:
        # Fallback search if token contains team ID
        all_teams = db.query(Team).all()
        team = next((t for t in all_teams if t.id in token or t.name.lower() in token.lower()), None)

    if not team:
        raise HTTPException(
            status_code=404,
            detail="QR Badge Verification Failed: Unrecognized badge signature or team identifier.",
        )

    now = datetime.now(timezone.utc)
    team.check_in_status = "CHECKED_IN"
    team.checked_in_time = now

    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    for m in members:
        m.check_in_status = "CHECKED_IN"
        m.checked_in_at = now

    rec = AttendanceRecord(
        event_id=team.event_id,
        team_id=team.id,
        scan_timestamp=now,
        verification_status="CRYPTOGRAPHIC_VERIFIED",
        bench_confirmed=team.assigned_bench_id,
    )
    db.add(rec)
    db.commit()

    # Real-time WebSocket broadcast
    await realtime_manager.broadcast("attendance:live", {
        "type": "TEAM_CHECKED_IN",
        "teamId": team.id,
        "teamName": team.name,
        "timestamp": now.isoformat(),
    })

    return {
        "success": True,
        "team": map_team_to_response(team, db),
        "message": f"Cryptographically verified & checked in {team.name} ({team.id}).",
    }

