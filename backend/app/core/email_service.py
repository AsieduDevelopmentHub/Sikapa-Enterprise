"""
Email service using Resend API for sending emails.
"""
import os
from typing import Optional
import resend
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Development email settings
resend_api_key = os.getenv("RESEND_API_KEY")
email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
default_from_email = os.getenv("DEFAULT_FROM_EMAIL", "Sikapa Enterprise <no-reply@localhost>")
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

if email_enabled and resend_api_key:
    resend.api_key = resend_api_key
else:
    if email_enabled and not resend_api_key:
        print("⚠️  WARNING: EMAIL_ENABLED=true but RESEND_API_KEY is missing.")
    if not email_enabled:
        print("⚠️  INFO: Emails are disabled for local development (EMAIL_ENABLED=false).")


class EmailService:
    """Service for sending emails via Resend API."""

    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str | None = None
    ) -> Optional[str]:
        """
        Send an email using Resend API.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            from_email: Sender email address (default: Sikapa noreply)

        Returns:
            Message ID if successful, None if failed
        """
        if from_email is None:
            from_email = default_from_email

        if not email_enabled or not resend_api_key:
            print(f"[DEBUG] Would send email to {to_email}: {subject}")
            print(f"[DEBUG] From: {from_email}")
            return "debug-mode"

        try:
            response = resend.Emails.send({
                "from": from_email,
                "to": to_email,
                "subject": subject,
                "html": html_content,
            })
            return response.get("id")
        except Exception as e:
            print(f"[ERROR] Failed to send email: {e}")
            return None

    @staticmethod
    def send_welcome_email(email: str, first_name: str = None) -> bool:
        """Send welcome email to new user."""
        name = first_name or "there"
        subject = "Welcome to Sikapa Enterprise!"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to Sikapa Enterprise, {name}!</h1>
            <p>Thank you for joining our platform. Your account has been created successfully.</p>
            <p>Please verify your email address to access all features.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <br>
            <p>Best regards,<br>The Sikapa Team</p>
        </div>
        """
        return EmailService.send_email(email, subject, html_content) is not None

    @staticmethod
    def send_email_verification(email: str, otp_code: str, first_name: str = None) -> bool:
        """Send email verification OTP code."""
        name = first_name or "there"
        subject = "Verify Your Email - Sikapa Enterprise"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Verify Your Email Address</h1>
            <p>Hello {name},</p>
            <p>Please use the following verification code to complete your email verification:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <h2 style="color: #333; margin: 0; font-size: 24px; letter-spacing: 3px;">{otp_code}</h2>
            </div>
            <p>This code will expire in 24 hours.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Sikapa Team</p>
        </div>
        """
        return EmailService.send_email(email, subject, html_content) is not None

    @staticmethod
    def send_password_reset(email: str, reset_token: str, first_name: str = None) -> bool:
        """Send password reset email with reset link."""
        name = first_name or "there"
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        subject = "Reset Your Password - Sikapa Enterprise"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Reset Your Password</h1>
            <p>Hello {name},</p>
            <p>You have requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">{reset_url}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Sikapa Team</p>
        </div>
        """
        return EmailService.send_email(email, subject, html_content) is not None

    @staticmethod
    def send_2fa_enabled(email: str, first_name: str = None) -> bool:
        """Send notification when 2FA is enabled."""
        name = first_name or "there"
        subject = "Two-Factor Authentication Enabled - Sikapa Enterprise"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">2FA Enabled Successfully</h1>
            <p>Hello {name},</p>
            <p>Two-factor authentication has been successfully enabled on your account.</p>
            <p>Your account is now more secure. You'll need both your password and an authenticator code to log in.</p>
            <p>Make sure to save your backup codes in a safe place in case you lose access to your authenticator app.</p>
            <br>
            <p>Best regards,<br>The Sikapa Team</p>
        </div>
        """
        return EmailService.send_email(email, subject, html_content) is not None

    @staticmethod
    def send_account_deletion(email: str, first_name: str = None) -> bool:
        """Send confirmation when account is deleted."""
        name = first_name or "there"
        subject = "Account Deleted - Sikapa Enterprise"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Account Deleted</h1>
            <p>Hello {name},</p>
            <p>Your Sikapa Enterprise account has been successfully deleted.</p>
            <p>All your data has been removed from our systems in accordance with our privacy policy.</p>
            <p>If you change your mind, you can always create a new account.</p>
            <br>
            <p>Thank you for using Sikapa Enterprise.</p>
            <p>Best regards,<br>The Sikapa Team</p>
        </div>
        """
        return EmailService.send_email(email, subject, html_content) is not None


# Global email service instance
email_service = EmailService()