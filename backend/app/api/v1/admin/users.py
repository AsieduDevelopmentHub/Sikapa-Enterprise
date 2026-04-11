"""
Admin user management routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.db import get_session
from app.api.v1.auth.dependencies import get_current_admin_user
from app.models import User
from app.api.v1.admin.schemas import UserManagementResponse
from app.api.v1.admin.services import (
    deactivate_user,
    activate_user,
    grant_admin_role,
    revoke_admin_role,
    get_all_users,
)

router = APIRouter()


@router.get("/", response_model=List[UserManagementResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: bool = None,
    is_admin: bool = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """List all users with optional filters."""
    return await get_all_users(
        session,
        skip=skip,
        limit=limit,
        is_active=is_active,
        is_admin=is_admin,
    )


@router.patch("/{user_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user_endpoint(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Deactivate a user."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself",
        )
    await deactivate_user(session, user_id)


@router.patch("/{user_id}/activate", status_code=status.HTTP_204_NO_CONTENT)
async def activate_user_endpoint(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Activate a user."""
    await activate_user(session, user_id)


@router.patch("/{user_id}/promote-admin", status_code=status.HTTP_204_NO_CONTENT)
async def grant_admin_role_endpoint(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Grant admin role to a user."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own admin role",
        )
    await grant_admin_role(session, user_id)


@router.patch("/{user_id}/revoke-admin", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_admin_role_endpoint(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Revoke admin role from a user."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke admin role from yourself",
        )
    await revoke_admin_role(session, user_id)
