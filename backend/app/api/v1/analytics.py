from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, User
from app.api.v1.events import require_event_scope
from app.models.entities import Team, Venue, Evaluation, Incident, Round, Event
from fastapi import HTTPException

router = APIRouter()


@router.get("/overview")
def get_analytics_overview(eventId: str, db: Session = Depends(get_db), actor: User = Depends(get_current_user)):
    """Executive metrics only for an authorized event."""
    event = db.query(Event).filter(Event.id == eventId).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, actor)
    total_teams = db.query(Team).filter(Team.event_id == eventId).count()
    checked_in = db.query(Team).filter(Team.event_id == eventId, Team.check_in_status == "CHECKED_IN").count()
    total_venues = db.query(Venue).filter(Venue.event_id == eventId).count()
    evaluations_count = db.query(Evaluation).filter(Evaluation.event_id == eventId).count()
    open_incidents = db.query(Incident).filter(Incident.event_id == eventId, Incident.status == "OPEN").count()

    check_in_rate = round((checked_in / total_teams) * 100, 1) if total_teams > 0 else 0.0

    return {
        "totalTeams": total_teams,
        "checkedInTeams": checked_in,
        "checkInRate": f"{check_in_rate}%",
        "activeVenues": total_venues,
        "submittedEvaluations": evaluations_count,
        "openIncidents": open_incidents,
        "systemHealth": "OPERATIONAL",
    }

