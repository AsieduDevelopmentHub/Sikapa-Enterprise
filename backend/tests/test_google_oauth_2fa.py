"""Google OAuth 2FA pending-token verification."""
import pytest
from httpx import AsyncClient

from app.core.security import create_oauth_2fa_pending_token


@pytest.mark.asyncio
async def test_google_verify_2fa_rejects_invalid_pending_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/google/verify-2fa",
        json={"pending_token": "not-a-valid-jwt-token-at-all", "code": "123456"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_google_verify_2fa_rejects_access_token_as_pending(client: AsyncClient):
    """Access tokens must not be accepted as OAuth 2FA pending tokens."""
    login = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "oauth2fauser",
            "name": "OAuth 2FA User",
            "email": "oauth2fa@example.com",
            "password": "SecurePass123!",
        },
    )
    assert login.status_code == 201

    pending = create_oauth_2fa_pending_token(login.json()["id"])
    # Tamper type claim by using a normal access token path — pending token with wrong
    # type is rejected by decode_oauth_2fa_pending_token.
    from app.core.security import create_access_token

    access = create_access_token({"sub": str(login.json()["id"])})
    response = await client.post(
        "/api/v1/auth/google/verify-2fa",
        json={"pending_token": access, "code": "123456"},
    )
    assert response.status_code == 401

    # Valid pending token shape but user has no 2FA enabled → 400
    response = await client.post(
        "/api/v1/auth/google/verify-2fa",
        json={"pending_token": pending, "code": "123456"},
    )
    assert response.status_code == 400
