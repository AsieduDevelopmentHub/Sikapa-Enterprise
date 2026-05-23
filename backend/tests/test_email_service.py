"""
Tests for email service integration
"""
import pytest

from app.core.email_service import EmailService


class TestEmailService:
    """Test email service functionality."""

    @pytest.fixture
    def email_service(self):
        """Email service fixture."""
        return EmailService

    def test_email_service_initialization(self):
        """Test email service can be imported and used."""
        assert EmailService is not None

    def test_send_welcome_email_debug_mode(self, email_service):
        """When EMAIL_ENABLED=false, queue path still reports success to callers."""
        result = email_service.send_welcome_email(
            email="test@example.com",
            first_name="Test",
        )
        assert result is True

    def test_send_email_verification_debug_mode(self, email_service):
        """When EMAIL_ENABLED=false, verification email is accepted without Resend."""
        result = email_service.send_email_verification(
            email="test@example.com",
            otp_code="123456",
            first_name="Test",
        )
        assert result is True

    def test_send_password_reset_debug_mode(self, email_service):
        result = email_service.send_password_reset(
            email="test@example.com",
            reset_token="reset-token-123",
            first_name="Test",
        )
        assert result is True

    def test_send_2fa_enabled_debug_mode(self, email_service):
        result = email_service.send_2fa_enabled(
            email="test@example.com",
            first_name="Test",
        )
        assert result is True

    def test_send_account_deletion_debug_mode(self, email_service):
        result = email_service.send_account_deletion(
            email="test@example.com",
            first_name="Test",
        )
        assert result is True
