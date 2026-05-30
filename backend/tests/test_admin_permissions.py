"""Admin RBAC: staff roles need explicit permissions; super_admin/admin bypass."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.core.security import create_access_token, get_password_hash
from app.models import User


def _admin_user(
    session: Session,
    *,
    username: str,
    admin_role: str,
    admin_permissions: str = "",
) -> tuple[User, str]:
    user = User(
        username=username,
        name=username.title(),
        email=f"{username}@example.com",
        hashed_password=get_password_hash("AdminPass123!"),
        is_active=True,
        email_verified=True,
        is_admin=True,
        admin_role=admin_role,
        admin_permissions=admin_permissions,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    token = create_access_token(
        {"sub": str(user.id), "is_admin": True, "admin_role": admin_role}
    )
    return user, token


@pytest.mark.asyncio
async def test_staff_without_manage_products_denied_product_list(
    client: AsyncClient, test_session: Session
):
    _, token = _admin_user(
        test_session,
        username="staff-analytics",
        admin_role="staff",
        admin_permissions="view_analytics",
    )
    headers = {"Authorization": f"Bearer {token}"}

    products_res = await client.get("/api/v1/admin/products/", headers=headers)
    assert products_res.status_code == 403
    assert "manage_products" in products_res.json()["detail"]

    analytics_res = await client.get(
        "/api/v1/admin/analytics/dashboard", headers=headers
    )
    assert analytics_res.status_code == 200


@pytest.mark.asyncio
async def test_non_admin_denied_admin_routes(
    client: AsyncClient, test_session: Session
):
    user = User(
        username="regular-user",
        name="Regular User",
        email="regular@example.com",
        hashed_password=get_password_hash("UserPass123!"),
        is_active=True,
        email_verified=True,
        is_admin=False,
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)
    token = create_access_token({"sub": str(user.id), "is_admin": False})

    res = await client.get(
        "/api/v1/admin/products/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert res.json()["detail"] == "Admin access required"


@pytest.mark.asyncio
async def test_admin_role_bypasses_permission_checks(
    client: AsyncClient, test_session: Session
):
    _, token = _admin_user(
        test_session,
        username="full-admin",
        admin_role="admin",
        admin_permissions="",
    )
    res = await client.get(
        "/api/v1/admin/products/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
