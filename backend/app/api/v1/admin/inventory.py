"""
Admin inventory monitoring and stock audit routes.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.api.v1.admin.schemas import InventoryAdjustmentRead
from app.api.v1.admin.services import create_inventory_adjustment, list_inventory_adjustments
from app.api.v1.auth.dependencies import require_admin_permission
from app.db import get_session
from app.models import User

router = APIRouter()


class InventoryAdjustmentCreate(BaseModel):
    product_id: int
    delta: int = Field(..., ne=0)
    reason: Optional[str] = None


@router.get("/logs", response_model=List[InventoryAdjustmentRead])
async def inventory_logs_admin(
    product_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("manage_inventory")),
):
    return await list_inventory_adjustments(
        session, product_id=product_id, skip=skip, limit=limit
    )


@router.post("/adjustments", response_model=InventoryAdjustmentRead, status_code=status.HTTP_201_CREATED)
async def inventory_adjust_admin(
    payload: InventoryAdjustmentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("manage_inventory")),
):
    return await create_inventory_adjustment(
        session,
        product_id=payload.product_id,
        delta=payload.delta,
        reason=payload.reason,
        admin_id=current_user.id,
    )
