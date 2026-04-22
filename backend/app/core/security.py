import os
from datetime import datetime, timedelta, timezone
import secrets
import string
import logging

from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import MissingBackendError, UnknownHashError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Require SECRET_KEY in production - no defaults for security-critical values
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    if is_production:
        raise ValueError(
            "FATAL: SECRET_KEY environment variable must be set in production. "
            "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    logger.warning("⚠️  SECRET_KEY not set - using unsafe default for development only!")
    SECRET_KEY = "UNSAFE-DEV-KEY-CHANGE-IN-PRODUCTION"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

if ACCESS_TOKEN_EXPIRE_MINUTES > 1440:  # 24 hours
    logger.warning("⚠️  ACCESS_TOKEN_EXPIRE_MINUTES is > 24h. Consider reducing for security.")
if REFRESH_TOKEN_EXPIRE_DAYS > 30:
    logger.warning("⚠️  REFRESH_TOKEN_EXPIRE_DAYS is > 30 days. Consider reducing for security.")

# ============ Password Management ============
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

# Legacy context for verifying old pbkdf2_sha256 hashes
legacy_context = CryptContext(
    schemes=["pbkdf2_sha256", "sha256_crypt"],
    deprecated="auto"
)

try:
    pwd_context.handler("bcrypt")
except Exception:
    logger.warning(
        "⚠️  bcrypt backend unavailable: password hashing may fail. "
        "Ensure bcrypt is installed: pip install bcrypt"
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password.
    Supports both bcrypt and legacy pbkdf2_sha256 formats for migration.
    """
    if not plain_password or not hashed_password:
        return False
    
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (MissingBackendError, UnknownHashError):
        logger.debug("Attempting legacy password verification")
        try:
            return legacy_context.verify(plain_password, hashed_password)
        except (MissingBackendError, UnknownHashError):
            return False


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt with secure rounds."""
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing failed: {e}")
        raise




# ============ JWT Token Management ============
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Claims to encode (typically {"sub": user_id})
        expires_delta: Custom expiration time (defaults to ACCESS_TOKEN_EXPIRE_MINUTES)
    
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access", "iat": now})
    
    try:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception as e:
        logger.error(f"Failed to create access token: {e}")
        raise


def create_refresh_token(data: dict) -> str:
    """
    Create JWT refresh token (long-lived).
    
    Args:
        data: Claims to encode (typically {"sub": user_id})
    
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh", "iat": now})
    
    try:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception as e:
        logger.error(f"Failed to create refresh token: {e}")
        raise


def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate JWT access token.
    
    Args:
        token: JWT token string
    
    Returns:
        Token payload if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            logger.warning("Invalid token type in access token")
            return None
        return payload
    except JWTError as e:
        logger.debug(f"Access token decode error: {e}")
        return None


def decode_refresh_token(token: str) -> dict | None:
    """
    Decode and validate JWT refresh token.
    
    Args:
        token: JWT token string
    
    Returns:
        Token payload if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            logger.warning("Invalid token type in refresh token")
            return None
        return payload
    except JWTError as e:
        logger.debug(f"Refresh token decode error: {e}")
        return None




# Short-lived token after Google OAuth when the user still must pass 2FA.
OAUTH_2FA_PENDING_MINUTES = 10


def create_oauth_2fa_pending_token(user_id: int) -> str:
    """Create temporary token for OAuth user awaiting 2FA verification."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=OAUTH_2FA_PENDING_MINUTES)
    
    try:
        return jwt.encode(
            {
                "sub": str(user_id),
                "exp": expire,
                "type": "oauth_2fa_pending",
                "iat": now,
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
    except Exception as e:
        logger.error(f"Failed to create OAuth 2FA pending token: {e}")
        raise


def decode_oauth_2fa_pending_token(token: str) -> dict | None:
    """Decode OAuth 2FA pending token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "oauth_2fa_pending":
            logger.warning("Invalid OAuth 2FA pending token type")
            return None
        return payload
    except JWTError as e:
        logger.debug(f"OAuth 2FA token decode error: {e}")
        return None



# ============ OTP & Verification Codes ============
def generate_otp_code(length: int = 6) -> str:
    """
    Generate a cryptographically secure OTP code (numeric).
    
    Args:
        length: Length of OTP code (default: 6)
    
    Returns:
        Random numeric string
    """
    if length < 4 or length > 10:
        raise ValueError("OTP length must be between 4 and 10")
    return "".join(secrets.choice(string.digits) for _ in range(length))


def generate_password_reset_token() -> str:
    """Generate a cryptographically secure password reset token."""
    return secrets.token_urlsafe(32)


def generate_backup_codes(count: int = 10) -> list[str]:
    """
    Generate backup codes for 2FA recovery.
    
    Format: XXXX-XXXX (8 alphanumeric characters + hyphen)
    
    Args:
        count: Number of codes to generate (default: 10)
    
    Returns:
        List of backup codes
    """
    if count < 1 or count > 20:
        raise ValueError("Backup code count must be between 1 and 20")
    
    codes = []
    for _ in range(count):
        code = "-".join([
            "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
            for _ in range(2)
        ])
        codes.append(code)
    return codes



# ============ 2FA & TOTP ============
def generate_totp_secret() -> str:
    """
    Generate a Base32-encoded TOTP secret for 2FA.
    Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
    """
    import base64
    
    # Generate 160-bit secret (RFC 4226 recommends minimum 128 bits)
    secret = secrets.token_bytes(20)
    return base64.b32encode(secret).decode("utf-8").rstrip("=")


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """
    Verify TOTP code against secret.
    
    Args:
        secret: Base32-encoded TOTP secret
        code: 6-digit code from authenticator app
        window: Time window tolerance (±1 = ±30 seconds)
    
    Returns:
        True if code is valid, False otherwise
    """
    if not secret or not code:
        return False
    
    if not code.isdigit() or len(code) != 6:
        logger.warning(f"Invalid TOTP code format: {len(code)} digits")
        return False
    
    try:
        import pyotp
        totp = pyotp.TOTP(secret)
        is_valid = totp.verify(code, valid_window=window)
        
        if not is_valid:
            logger.warning("TOTP verification failed")
        
        return is_valid
    except Exception as e:
        logger.error(f"TOTP verification error: {e}")
        return False


def get_totp_qr_code(secret: str, name: str, issuer: str = "Sikapa") -> str:
    """
    Generate QR code URI for TOTP setup (as base64-encoded PNG).
    
    Args:
        secret: Base32-encoded TOTP secret
        name: User identifier (email or username)
        issuer: Issuer name displayed in authenticator
    
    Returns:
        Base64-encoded PNG image as data URI
    """
    if not secret or not name:
        raise ValueError("Secret and name are required")
    
    try:
        import pyotp
        import qrcode
        from io import BytesIO
        import base64

        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=name, issuer_name=issuer)

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        logger.debug(f"QR code generated for {name}")
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        logger.error(f"Failed to generate QR code: {e}")
        raise ValueError(f"Failed to generate QR code: {str(e)}")

