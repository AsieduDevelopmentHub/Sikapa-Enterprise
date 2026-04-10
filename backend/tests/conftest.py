"""
Pytest configuration and shared fixtures for E2E tests
"""
import asyncio
import os
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.db import get_session
from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    # Use in-memory SQLite for tests
    test_database_url = "sqlite+aiosqlite:///:memory:"

    engine = create_async_engine(
        test_database_url,
        echo=False,
        future=True,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine

    # Cleanup
    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Clear all tables before each test
        async with session.begin():
            for table in reversed(SQLModel.metadata.sorted_tables):
                await session.execute(table.delete())

        yield session

        # Rollback any uncommitted changes
        await session.rollback()


@pytest.fixture(scope="function")
async def client(test_session) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database session override."""

    async def override_get_session():
        yield test_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client

    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
def set_test_env():
    """Set test environment variables."""
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
    os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
    os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key"
    os.environ["JWT_REFRESH_SECRET_KEY"] = "test-jwt-refresh-secret-key"
    os.environ["RESEND_API_KEY"] = "test-resend-api-key"  # For testing email service
    os.environ["EMAIL_FROM"] = "test@example.com"
    os.environ["FRONTEND_URL"] = "http://localhost:3000"
    os.environ["HTTPS_ENABLED"] = "false"  # Disable HTTPS for tests
    os.environ["TESTING"] = "true"


@pytest.fixture(scope="function")
async def test_user(client: AsyncClient, test_session: AsyncSession):
    """Create a test user and return user data with tokens."""
    from app.models import User

    # Register user
    register_data = {
        "email": "testuser@example.com",
        "password": "TestPass123!",
        "first_name": "Test",
        "last_name": "User"
    }

    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 201
    user_data = response.json()

    # Get OTP and verify email
    from app.models import OTPCode
    from sqlalchemy import select

    otp_query = select(OTPCode).where(OTPCode.user_id == user_data["id"])
    result = await test_session.execute(otp_query)
    otp_record = result.scalar_one()

    verify_data = {
        "email": "testuser@example.com",
        "code": otp_record.code
    }

    response = await client.post("/api/v1/auth/verify-email", json=verify_data)
    assert response.status_code == 200

    # Login to get tokens
    login_data = {
        "email": "testuser@example.com",
        "password": "TestPass123!"
    }

    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    tokens = response.json()

    return {
        "user": user_data,
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"]
    }


@pytest.fixture(scope="function")
async def authenticated_client(client: AsyncClient, test_user):
    """Create authenticated test client."""
    client.headers.update({"Authorization": f"Bearer {test_user['access_token']}"})
    return client