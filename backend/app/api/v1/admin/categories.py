"""
Admin category management routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.db import get_session
from app.api.v1.auth.dependencies import get_current_admin_user
from app.api.v1.admin.services import (
    create_category_admin,
    update_category_admin,
    delete_category_admin,
    get_all_categories_admin,
)
from app.api.v1.admin.schemas import (
    CategoryAdminRead,
    CategoryAdminCreate,
    CategoryAdminUpdate,
)
from app.models import User

router = APIRouter()


@router.get("/", response_model=List[CategoryAdminRead])
async def list_categories_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: bool = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """List categories for admin management."""
    return await get_all_categories_admin(session, skip, limit, is_active)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryAdminCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    return await create_category_admin(session, payload.dict())


@router.put("/{category_id}")
async def update_category(
    category_id: int,
    payload: CategoryAdminUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    return await update_category_admin(session, category_id, payload.dict(exclude_none=True))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    await delete_category_admin(session, category_id)
