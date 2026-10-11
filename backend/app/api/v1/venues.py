import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Venue, Bench, Team, User
from app.api.event_access import ensure_event_access, get_event_or_404
from app.schemas.entities import VenueCreate, VenueResponse, BenchResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter()


def map_venue_to_response(venue: Venue, db: Session) -> VenueResponse:
    benches = db.query(Bench).filter(Bench.venue_id == venue.id).all()
    bench_schemas = []
    for b in benches:
        team = db.query(Team).filter(Team.id == b.assigned_team_id).first() if b.assigned_team_id else None
        bench_schemas.append(
            BenchResponse(
                id=b.id,
                label=b.label,
                status=b.status,
                hasPower=b.has_power,
                hasEthernet=b.has_ethernet,
                assignedTeamId=b.assigned_team_id,
                assignedTeamName=team.name if team else None,
            )
        )

    return VenueResponse(
        id=venue.id,
        eventId=venue.event_id,
        name=venue.name,
        building=venue.building,
        floor=venue.floor,
        capacity=venue.capacity,
        hasPower=venue.has_power,
        hasInternet=venue.has_internet,
        isAccessible=venue.is_accessible,
        equipment=venue.equipment or [],
        supportedDomains=venue.supported_domains or [],
        status=venue.status,
        benches=bench_schemas,
    )


@router.get("", response_model=List[VenueResponse])
def list_venues(
    eventId: str = "evt-01",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List venues only for an authorized event."""
    event = get_event_or_404(eventId, db)
    ensure_event_access(event, current_user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "JUDGE", "VOLUNTEER", "TECHNICAL_STAFF", "RESOURCE_MANAGER"})
    venues = db.query(Venue).filter(Venue.event_id == eventId).all()
    return [map_venue_to_response(v, db) for v in venues]


@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(
    venue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve venue details only for an authorized event."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found.")
    event = get_event_or_404(venue.event_id, db)
    ensure_event_access(event, current_user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "JUDGE", "VOLUNTEER", "TECHNICAL_STAFF", "RESOURCE_MANAGER"})
    return map_venue_to_response(venue, db)


@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
def create_venue(
    payload: VenueCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"])),
):
    """Create a new venue and automatically generate bench slots."""
    event = get_event_or_404(payload.eventId, db)
    ensure_event_access(event, _user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"})
    new_id = f"ven-{uuid.uuid4().hex[:6]}"
    venue = Venue(
        id=new_id,
        event_id=payload.eventId,
        name=payload.name,
        building=payload.building,
        floor=payload.floor,
        capacity=payload.capacity,
        has_power=payload.hasPower,
        has_internet=payload.hasInternet,
        is_accessible=payload.isAccessible,
        equipment=payload.equipment,
        supported_domains=payload.supportedDomains,
        status="ACTIVE",
    )
    db.add(venue)
    db.commit()

    # Generate benches based on capacity
    bench_count = min(payload.capacity, 20)
    for i in range(1, bench_count + 1):
        bench = Bench(
            id=f"{new_id}-b{i:02d}",
            venue_id=new_id,
            label=f"Bench {i:02d}",
            status="available",
            has_power=payload.hasPower,
            has_ethernet=payload.hasInternet,
        )
        db.add(bench)
    db.commit()

    return map_venue_to_response(venue, db)


@router.get("/{venue_id}/benches", response_model=List[BenchResponse])
def list_benches(
    venue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve seating benches only within an authorized event."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found.")
    event = get_event_or_404(venue.event_id, db)
    ensure_event_access(event, current_user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "JUDGE", "VOLUNTEER", "TECHNICAL_STAFF", "RESOURCE_MANAGER"})
    benches = db.query(Bench).filter(Bench.venue_id == venue_id).all()
    result = []
    for b in benches:
        team = db.query(Team).filter(Team.id == b.assigned_team_id).first() if b.assigned_team_id else None
        result.append(
            BenchResponse(
                id=b.id,
                label=b.label,
                status=b.status,
                hasPower=b.has_power,
                hasEthernet=b.has_ethernet,
                assignedTeamId=b.assigned_team_id,
                assignedTeamName=team.name if team else None,
            )
        )
    return result

