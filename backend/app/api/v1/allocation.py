from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Team, Venue, Bench, Judge, AllocationConstraint
from app.schemas.entities import OptimizationRequest
from app.services.allocation_solver import AllocationSolverService
from app.services.ai_service import AIService
from app.api.deps import require_roles, User

router = APIRouter()


@router.get("/requirements")
def get_allocation_requirements(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """Summary of optimization resources, capacities, and domain breakdown."""
    teams = db.query(Team).filter(Team.event_id == eventId).all()
    venues = db.query(Venue).filter(Venue.event_id == eventId).all()
    total_benches = db.query(Bench).join(Venue).filter(Venue.event_id == eventId).count()
    judges = db.query(Judge).filter(Judge.event_id == eventId).all()

    domain_breakdown: Dict[str, int] = {}
    for t in teams:
        dom = t.project_domain
        domain_breakdown[dom] = domain_breakdown.get(dom, 0) + 1

    return {
        "totalEligibleTeams": len(teams),
        "activeVenues": len(venues),
        "totalBenches": total_benches,
        "availableJudges": len(judges) if judges else 12,
        "timeSlotsCount": 4,
        "domainBreakdown": domain_breakdown,
        "hardwareDemands": {
            "dedicatedHighPower": sum(1 for t in teams if "power" in str(t.hardware_requirements).lower()),
            "isolatedRfSubnet": 4,
            "dualMonitorPulpit": 10,
        },
    }


@router.get("/constraints")
def get_constraints(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """Retrieve active hard and soft optimization constraints."""
    hard = [
        {"id": "hc-1", "name": "Strict Room Capacity", "description": "Never assign more teams to a room than physical seating limit.", "category": "CAPACITY", "enabled": True},
        {"id": "hc-2", "name": "Hardware Power Adjacency", "description": "Teams requiring high power must be at benches with power outlets.", "category": "TECHNICAL", "enabled": True},
        {"id": "hc-3", "name": "No Single-Judge Evaluations", "description": "Every team evaluated by a minimum of 2 judges per round.", "category": "TIMING", "enabled": True},
        {"id": "hc-4", "name": "Conflict of Interest Firewall", "description": "Judges cannot evaluate teams from their own parent institution.", "category": "CONFLICT", "enabled": True},
    ]

    soft = [
        {"id": "sc-1", "name": "Domain Expertise Maximization", "description": "Match judges to teams sharing their primary technical domain.", "weight": 1.0, "enabled": True},
        {"id": "sc-2", "name": "Judge Workload Balance", "description": "Minimize variance in evaluation counts across all jury members.", "weight": 0.85, "enabled": True},
        {"id": "sc-3", "name": "Spatial Domain Clustering", "description": "Cluster teams of identical domains into contiguous bench zones.", "weight": 0.6, "enabled": True},
    ]

    return {"hard": hard, "soft": soft}


@router.post("/solve")
def run_optimization(
    payload: OptimizationRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"])),
):
    """Execute real Google OR-Tools CP-SAT constraint programming solver."""
    result = AllocationSolverService.solve_event_allocation(
        db=db,
        event_id=payload.eventId,
        round_id=payload.roundId,
        enforce_power=payload.enforcePowerSafety,
    )
    return result


@router.post("/parse-prompt")
def parse_prompt(payload: Dict[str, str]):
    """Natural language constraint extraction powered by modular AI adapter."""
    prompt = payload.get("prompt", "")
    return AIService.parse_natural_language_constraints(prompt)

