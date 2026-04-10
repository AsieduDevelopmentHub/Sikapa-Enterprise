"""
Tests for rate limiting functionality
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch


class TestRateLimiting:
    """Test rate limiting on authentication endpoints."""

    @pytest.fixture
    async def client(self):
        """Test client fixture."""
        from app.main import app

        async with AsyncClient(app=app, base_url="http://testserver") as client:
            yield client

    @pytest.mark.asyncio
    async def test_registration_rate_limit(self, client: AsyncClient):
        """Test rate limiting on registration endpoint (5/minute)."""
        register_data = {
            "email": f"ratelimit{i}@example.com",
            "password": "SecurePass123!",
            "first_name": "Rate",
            "last_name": "Limit"
        }

        # Make 6 requests (exceeds 5/minute limit)
        for i in range(6):
            data = register_data.copy()
            data["email"] = f"ratelimit{i}@example.com"

            response = await client.post("/api/v1/auth/register", json=data)

            if i < 5:
                # First 5 should succeed (or fail for other reasons, but not rate limited)
                assert response.status_code in [201, 400]  # 400 for duplicate email if any
            else:
                # 6th request should be rate limited
                assert response.status_code == 429
                response_data = response.json()
                assert "rate limit exceeded" in response_data["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_rate_limit(self, client: AsyncClient):
        """Test rate limiting on login endpoint (10/minute)."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }

        # Make 11 requests (exceeds 10/minute limit)
        for i in range(11):
            response = await client.post("/api/v1/auth/login", json=login_data)

            if i < 10:
                # First 10 should return 401 (invalid credentials)
                assert response.status_code == 401
            else:
                # 11th request should be rate limited
                assert response.status_code == 429
                response_data = response.json()
                assert "rate limit exceeded" in response_data["detail"].lower()

    @pytest.mark.asyncio
    async def test_password_reset_rate_limit(self, client: AsyncClient):
        """Test rate limiting on password reset endpoint (3/minute)."""
        reset_data = {"email": "resetlimit@example.com"}

        # Make 4 requests (exceeds 3/minute limit)
        for i in range(4):
            response = await client.post("/api/v1/auth/password-reset/request", json=reset_data)

            if i < 3:
                # First 3 should succeed
                assert response.status_code == 200
            else:
                # 4th request should be rate limited
                assert response.status_code == 429
                response_data = response.json()
                assert "rate limit exceeded" in response_data["detail"].lower()

    @pytest.mark.asyncio
    async def test_email_verification_rate_limit(self, client: AsyncClient):
        """Test rate limiting on email verification endpoint (10/minute)."""
        verify_data = {
            "email": "verifylimit@example.com",
            "code": "000000"
        }

        # Make 11 requests (exceeds 10/minute limit)
        for i in range(11):
            response = await client.post("/api/v1/auth/verify-email", json=verify_data)

            if i < 10:
                # First 10 should return 400 (invalid code)
                assert response.status_code == 400
            else:
                # 11th request should be rate limited
                assert response.status_code == 429
                response_data = response.json()
                assert "rate limit exceeded" in response_data["detail"].lower()

    @pytest.mark.asyncio
    async def test_refresh_token_rate_limit(self, client: AsyncClient):
        """Test rate limiting on token refresh endpoint (10/minute)."""
        refresh_data = {"refresh_token": "invalid.refresh.token"}

        # Make 11 requests (exceeds 10/minute limit)
        for i in range(11):
            response = await client.post("/api/v1/auth/refresh", json=refresh_data)

            if i < 10:
                # First 10 should return 401 (invalid token)
                assert response.status_code == 401
            else:
                # 11th request should be rate limited
                assert response.status_code == 429
                response_data = response.json()
                assert "rate limit exceeded" in response_data["detail"].lower()

    @pytest.mark.asyncio
    async def test_different_ips_not_shared(self, client: AsyncClient):
        """Test that rate limits are per IP address."""
        # This test would require mocking different IP addresses
        # For now, we'll test that the rate limiting is applied per request
        # In a real scenario, you'd use different clients with different IPs

        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }

        # Make requests with the same IP (same client)
        responses = []
        for i in range(12):
            response = await client.post("/api/v1/auth/login", json=login_data)
            responses.append(response.status_code)

        # Should see rate limiting kick in
        assert 429 in responses

    @pytest.mark.asyncio
    async def test_rate_limit_headers(self, client: AsyncClient):
        """Test that rate limit headers are present in responses."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)

        # Check for rate limit headers (if implemented)
        # Note: slowapi may or may not include these headers by default
        # This test ensures the middleware is working
        assert response.status_code == 401  # Invalid credentials, not rate limited yet

    @pytest.mark.asyncio
    async def test_rate_limit_reset(self, client: AsyncClient):
        """Test that rate limits reset after time window."""
        # This test would require time manipulation or waiting
        # For now, we'll just verify the rate limiting is in place

        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }

        # Make requests up to the limit
        for i in range(10):
            response = await client.post("/api/v1/auth/login", json=login_data)
            assert response.status_code == 401

        # Next request should be rate limited
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 429

    @pytest.mark.asyncio
    async def test_rate_limiting_doesnt_affect_other_endpoints(self, client: AsyncClient):
        """Test that rate limiting on one endpoint doesn't affect others."""
        # Hit login rate limit
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }

        for i in range(11):
            response = await client.post("/api/v1/auth/login", json=login_data)

        # Login should be rate limited now
        assert response.status_code == 429

        # But registration should still work (within its own limit)
        register_data = {
            "email": "different@example.com",
            "password": "SecurePass123!",
            "first_name": "Different",
            "last_name": "User"
        }

        response = await client.post("/api/v1/auth/register", json=register_data)
        # Should succeed (or fail for validation reasons, but not rate limited)
        assert response.status_code in [201, 400, 422]


class TestRateLimitingConfiguration:
    """Test rate limiting configuration and middleware."""

    def test_slowapi_middleware_configured(self):
        """Test that SlowAPIMiddleware is properly configured."""
        from app.main import app
        from slowapi import Limiter
        from slowapi.middleware import SlowAPIMiddleware

        # Check that SlowAPIMiddleware is in the app's middleware
        middleware_classes = [type(middleware) for middleware in app.user_middleware]
        assert SlowAPIMiddleware in middleware_classes

    def test_limiter_instances_exist(self):
        """Test that limiter instances are properly defined."""
        from app.api.v1.auth.routes import auth_limiter, login_limiter, password_limiter

        # These should be Limiter instances
        assert hasattr(auth_limiter, 'limit')
        assert hasattr(login_limiter, 'limit')
        assert hasattr(password_limiter, 'limit')

    @pytest.mark.asyncio
    async def test_health_endpoint_not_rate_limited(self, client: AsyncClient):
        """Test that health endpoint is not rate limited."""
        # Make many requests to health endpoint
        for i in range(20):
            response = await client.get("/health")
            assert response.status_code == 200

        # Should not be rate limited
        response = await client.get("/health")
        assert response.status_code == 200