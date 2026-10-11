from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Resource, ResourceDistribution, Team, User
from app.api.event_access import ensure_event_access, get_event_or_404
from app.api.deps import get_current_user

router = APIRouter()


@router.get("")
def list_resources(
    eventId: str = "evt-01",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List resource inventory only within an authorized event."""
    event = get_event_or_404(eventId, db)
    ensure_event_access(event, current_user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "RESOURCE_MANAGER"})
    items = db.query(Resource).filter(Resource.event_id == eventId).all()
    return [
        {
            "id": r.id,
            "category": r.category,
            "itemName": r.item_name,
            "totalQuantity": r.total_quantity,
            "distributedQuantity": r.distributed_quantity,
            "unit": r.unit,
        }
        for r in items
    ]


@router.post("/distribute")
def distribute_resource(
    resourceId: str,
    teamId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark physical asset distribution to a team."""
    res = db.query(Resource).filter(Resource.id == resourceId).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource item not found.")
    team = db.query(Team).filter(Team.id == teamId).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team.event_id != res.event_id:
        raise HTTPException(status_code=403, detail="Resource and team must belong to the same event.")

    event = get_event_or_404(res.event_id, db)
    ensure_event_access(event, current_user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "RESOURCE_MANAGER"})
    if (res.distributed_quantity or 0) >= res.total_quantity:
        raise HTTPException(status_code=409, detail="No inventory remains for this resource.")

    res.distributed_quantity = (res.distributed_quantity or 0) + 1
    dist = ResourceDistribution(
        event_id=res.event_id,
        resource_id=res.id,
        team_id=team.id,
        distributed_by=current_user.id,
    )
    db.add(dist)
    db.commit()

    return {
        "success": True,
        "resourceId": res.id,
        "distributedQuantity": res.distributed_quantity,
        "totalQuantity": res.total_quantity,
    }

