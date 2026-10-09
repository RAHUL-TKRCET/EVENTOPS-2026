from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Team, Venue, Evaluation, Incident, Round

router = APIRouter()


@router.get("/overview")
def get_analytics_overview(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """Executive metrics and operational telemetry summary."""
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

