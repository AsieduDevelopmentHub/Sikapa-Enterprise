"""
End-to-End tests for Sikapa Authentication System
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.models import User, OTPCode, TokenBlacklist, TwoFactorSecret, PasswordReset


@pytest.mark.asyncio
class TestAuthenticationE2E:
    """End-to-end tests for the complete authentication flow."""

    async def test_complete_user_registration_flow(self, client: AsyncClient, test_session: AsyncSession):
        """Test complete user registration flow: register -> verify email -> login."""
        # 1. Register user
        register_data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User"
        }

        response = await client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 201
        user_data = response.json()
        assert user_data["email"] == "test@example.com"
        assert user_data["email_verified"] is False

        # 2. Get OTP code from database (in real scenario, this would be emailed)
        otp_query = select(OTPCode).where(OTPCode.user_id == user_data["id"])
        result = await test_session.execute(otp_query)
        otp_record = result.scalar_one()
        otp_code = otp_record.code

        # 3. Verify email with OTP
        verify_data = {
            "email": "test@example.com",
            "code": otp_code
        }

        response = await client.post("/api/v1/auth/verify-email", json=verify_data)
        assert response.status_code == 200
        verify_response = response.json()
        assert verify_response["verified"] is True

        # 4. Login with verified account
        login_data = {
            "email": "test@example.com",
            "password": "SecurePass123!"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        tokens = response.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"

        # Store tokens for further tests
        self.access_token = tokens["access_token"]
        self.refresh_token = tokens["refresh_token"]

    async def test_password_reset_flow(self, client: AsyncClient, test_session: AsyncSession):
        """Test password reset flow."""
        # 1. Request password reset
        reset_request = {"email": "test@example.com"}

        response = await client.post("/api/v1/auth/password-reset/request", json=reset_request)
        assert response.status_code == 200

        # 2. Get reset token from database
        reset_query = select(PasswordReset).join(User).where(User.email == "test@example.com")
        result = await test_session.execute(reset_query)
        reset_record = result.scalar_one()
        reset_token = reset_record.token

        # 3. Reset password with token
        reset_confirm = {
            "token": reset_token,
            "new_password": "NewSecurePass456!"
        }

        response = await client.post("/api/v1/auth/password-reset/confirm", json=reset_confirm)
        assert response.status_code == 200

        # 4. Login with new password
        login_data = {
            "email": "test@example.com",
            "password": "NewSecurePass456!"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200

    async def test_profile_management(self, client: AsyncClient):
        """Test user profile management."""
        # Get profile
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = await client.get("/api/v1/auth/profile", headers=headers)
        assert response.status_code == 200
        profile = response.json()
        assert profile["email"] == "test@example.com"
        assert profile["first_name"] == "Test"

        # Update profile
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "phone": "+1234567890"
        }

        response = await client.put("/api/v1/auth/profile", json=update_data, headers=headers)
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["first_name"] == "Updated"
        assert updated_profile["phone"] == "+1234567890"

    async def test_two_factor_authentication_flow(self, client: AsyncClient, test_session: AsyncSession):
        """Test 2FA setup and usage."""
        headers = {"Authorization": f"Bearer {self.access_token}"}

        # 1. Setup 2FA
        response = await client.post("/api/v1/auth/2fa/setup", headers=headers)
        assert response.status_code == 200
        setup_data = response.json()
        assert "secret" in setup_data
        assert "qr_code" in setup_data
        assert "backup_codes" in setup_data
        assert len(setup_data["backup_codes"]) == 10

        secret = setup_data["secret"]
        backup_codes = setup_data["backup_codes"]

        # 2. Generate a valid TOTP code (in real test, would use pyotp)
        import pyotp
        totp = pyotp.TOTP(secret)
        verification_code = totp.now()

        # 3. Enable 2FA
        enable_data = {
            "secret": secret,
            "backup_codes": backup_codes,
            "verification_code": verification_code
        }

        response = await client.post("/api/v1/auth/2fa/enable", json=enable_data, headers=headers)
        assert response.status_code == 200

        # 4. Logout and login with 2FA
        response = await client.post("/api/v1/auth/logout", headers=headers)
        assert response.status_code == 200

        # 5. Login with 2FA required now
        login_data = {
            "email": "test@example.com",
            "password": "NewSecurePass456!",
            "code": totp.now()  # Generate new code
        }

        response = await client.post("/api/v1/auth/login-2fa", json=login_data)
        assert response.status_code == 200
        new_tokens = response.json()
        assert "access_token" in new_tokens

        # Update token for further tests
        self.access_token = new_tokens["access_token"]

    async def test_token_refresh(self, client: AsyncClient):
        """Test token refresh functionality."""
        # Refresh access token
        refresh_data = {"refresh_token": self.refresh_token}

        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 200
        new_tokens = response.json()
        assert "access_token" in new_tokens
        assert new_tokens["token_type"] == "bearer"

        # Update access token
        self.access_token = new_tokens["access_token"]

    async def test_password_change(self, client: AsyncClient):
        """Test password change functionality."""
        headers = {"Authorization": f"Bearer {self.access_token}"}

        change_data = {
            "current_password": "NewSecurePass456!",
            "new_password": "FinalSecurePass789!"
        }

        response = await client.post("/api/v1/auth/password/change", json=change_data, headers=headers)
        assert response.status_code == 200

        # Logout and login with new password
        response = await client.post("/api/v1/auth/logout", headers=headers)
        assert response.status_code == 200

        login_data = {
            "email": "test@example.com",
            "password": "FinalSecurePass789!"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200

    async def test_account_deletion(self, client: AsyncClient, test_session: AsyncSession):
        """Test account deletion."""
        # Login first to get token
        login_data = {
            "email": "test@example.com",
            "password": "FinalSecurePass789!"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        tokens = response.json()
        access_token = tokens["access_token"]

        headers = {"Authorization": f"Bearer {access_token}"}

        # Delete account
        delete_data = {"password": "FinalSecurePass789!"}

        response = await client.post("/api/v1/auth/account/delete", json=delete_data, headers=headers)
        assert response.status_code == 200

        # Verify account is deactivated
        user_query = select(User).where(User.email == "test@example.com")
        result = await test_session.execute(user_query)
        user = result.scalar_one()
        assert user.is_active is False

    async def test_rate_limiting(self, client: AsyncClient):
        """Test rate limiting on auth endpoints."""
        # Test login rate limiting (10/minute)
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }

        # Make multiple requests quickly
        for i in range(12):  # Exceed the 10/minute limit
            response = await client.post("/api/v1/auth/login", json=login_data)
            if i < 10:
                assert response.status_code == 401  # Invalid credentials
            else:
                assert response.status_code == 429  # Rate limited

    async def test_security_headers(self, client: AsyncClient):
        """Test security headers are present."""
        response = await client.get("/health")

        # Check for security headers (when HTTPS is enabled)
        if "HTTPS_ENABLED=true" in str(response.headers):
            assert "strict-transport-security" in response.headers
            assert "x-content-type-options" in response.headers
            assert "x-frame-options" in response.headers
            assert "x-xss-protection" in response.headers

    async def test_invalid_token_handling(self, client: AsyncClient):
        """Test handling of invalid tokens."""
        invalid_headers = {"Authorization": "Bearer invalid.jwt.token"}

        response = await client.get("/api/v1/auth/profile", headers=invalid_headers)
        assert response.status_code == 401

        response_data = response.json()
        assert "Invalid token" in response_data["detail"]

    async def test_missing_auth_header(self, client: AsyncClient):
        """Test handling of missing authorization header."""
        response = await client.get("/api/v1/auth/profile")
        assert response.status_code == 401

        response_data = response.json()
        assert "Missing or invalid authorization header" in response_data["detail"]


@pytest.mark.asyncio
class TestErrorHandling:
    """Test error handling and edge cases."""

    @pytest.fixture
    async def client(self):
        """Test client fixture."""
        async with AsyncClient(app=app, base_url="http://testserver") as client:
            yield client

    async def test_duplicate_email_registration(self, client: AsyncClient):
        """Test registration with duplicate email."""
        # First registration
        register_data = {
            "email": "duplicate@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User"
        }

        response = await client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 201

        # Second registration with same email
        response = await client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    async def test_invalid_otp_verification(self, client: AsyncClient):
        """Test verification with invalid OTP."""
        verify_data = {
            "email": "nonexistent@example.com",
            "code": "000000"
        }

        response = await client.post("/api/v1/auth/verify-email", json=verify_data)
        assert response.status_code == 400
        assert "Invalid or expired OTP code" in response.json()["detail"]

    async def test_weak_password_registration(self, client: AsyncClient):
        """Test registration with weak password."""
        register_data = {
            "email": "weak@example.com",
            "password": "123",  # Too short
            "first_name": "Test",
            "last_name": "User"
        }

        response = await client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 422  # Validation error

    async def test_invalid_email_format(self, client: AsyncClient):
        """Test registration with invalid email format."""
        register_data = {
            "email": "invalid-email",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User"
        }

        response = await client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 422  # Validation error

    async def test_expired_reset_token(self, client: AsyncClient):
        """Test password reset with expired token."""
        reset_data = {
            "token": "expired.reset.token",
            "new_password": "NewSecurePass123!"
        }

        response = await client.post("/api/v1/auth/password-reset/confirm", json=reset_data)
        assert response.status_code == 400
        assert "Invalid or expired reset token" in response.json()["detail"]