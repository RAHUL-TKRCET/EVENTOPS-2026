from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Resource, ResourceDistribution
from app.api.deps import get_current_user, User

router = APIRouter()


@router.get("")
def list_resources(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """List physical kit, badge, and meal inventory items."""
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

