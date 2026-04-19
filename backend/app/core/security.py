import os
from datetime import datetime, timedelta
import secrets
import string

import logging
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import MissingBackendError, UnknownHashError

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto",
    bcrypt__rounds=12,
)

legacy_context = CryptContext(
    schemes=["pbkdf2_sha256", "sha256_crypt"],
    deprecated="auto"
)

try:
    # Validate backend availability without forcing a password hash on import.
    pwd_context.handler("bcrypt")
except Exception:
    logger.warning(
        "bcrypt backend unavailable: existing bcrypt-hashed passwords may not verify. "
        "Install bcrypt in the active Python environment."
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (MissingBackendError, UnknownHashError):
        try:
            return legacy_context.verify(plain_password, hashed_password)
        except (MissingBackendError, UnknownHashError):
            return False


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt when available, otherwise fallback to pbkdf2_sha256."""
    try:
        return pwd_context.hash(password)
    except (MissingBackendError, ValueError, TypeError):
        fallback_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
        return fallback_context.hash(password)


# ============ JWT Token Management ============
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
        return payload
    except JWTError as exc:
        raise exc


def decode_refresh_token(token: str) -> dict:
    """Decode JWT refresh token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise JWTError("Invalid token type")
        return payload
    except JWTError as exc:
        raise exc


# Short-lived token after Google OAuth when the user still must pass TOTP.
OAUTH_2FA_PENDING_MINUTES = 10


def create_oauth_2fa_pending_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=OAUTH_2FA_PENDING_MINUTES)
    return jwt.encode(
        {
            "sub": str(user_id),
            "exp": expire,
            "type": "oauth_2fa_pending",
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_oauth_2fa_pending_token(token: str) -> dict:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != "oauth_2fa_pending":
        raise JWTError("Invalid token type")
    return payload


# ============ OTP & Verification Codes ============
def generate_otp_code(length: int = 6) -> str:
    """Generate a random OTP code (numeric)."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def generate_password_reset_token() -> str:
    """Generate a secure password reset token."""
    return secrets.token_urlsafe(32)


def generate_backup_codes(count: int = 10) -> list[str]:
    """Generate backup codes for 2FA."""
    codes = []
    for _ in range(count):
        # Format: XXXX-XXXX (8 characters + hyphen)
        code = "-".join([
            "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
            for _ in range(2)
        ])
        codes.append(code)
    return codes


# ============ 2FA & TOTP ============
def generate_totp_secret() -> str:
    """Generate a base32 TOTP secret for 2FA."""
    import base64

    # Generate a 160-bit secret and encode it in Base32 so it is compatible with pyotp.
    return base64.b32encode(secrets.token_bytes(20)).decode("utf-8").rstrip("=")


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """Verify TOTP code (requires pyotp)."""
    try:
        import pyotp
        totp = pyotp.TOTP(secret)
        # Check current and previous/next time windows for flexibility
        return totp.verify(code, valid_window=window)
    except Exception:
        return False


def get_totp_qr_code(secret: str, name: str, issuer: str = "Sikapa") -> str:
    """Generate QR code for TOTP setup (requires qrcode and pyotp)."""
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
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        raise ValueError(f"Failed to generate QR code: {str(e)}")
