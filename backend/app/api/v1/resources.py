from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Resource, ResourceDistribution, Event, Team
from app.api.deps import get_current_user, User, require_roles
from app.api.v1.events import require_event_scope

router = APIRouter()


@router.get("")
def list_resources(eventId: str = "evt-01", db: Session = Depends(get_db), actor: User = Depends(get_current_user)):
    """List inventory only for an event the actor is authorized to manage."""
    event = db.query(Event).filter(Event.id == eventId).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, actor)
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
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "RESOURCE_MANAGER"])),
):
    """Distribute an asset only after verifying resource, event, and team scope."""
    res = db.query(Resource).filter(Resource.id == resourceId).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource item not found.")
    event = db.query(Event).filter(Event.id == res.event_id).first()
    team = db.query(Team).filter(Team.id == teamId).first()
    if not event or not team:
        raise HTTPException(status_code=404, detail="Event resource or team not found.")
    if team.event_id != res.event_id:
        raise HTTPException(status_code=403, detail="The team and resource must belong to the same event.")
    require_event_scope(event, current_user)

    if (res.distributed_quantity or 0) >= res.total_quantity:
        raise HTTPException(status_code=409, detail="No remaining inventory is available.")
    res.distributed_quantity = (res.distributed_quantity or 0) + 1
    dist = ResourceDistribution(
        event_id=res.event_id,
        resource_id=res.id,
        team_id=teamId,
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

