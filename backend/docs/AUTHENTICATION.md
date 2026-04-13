# Authentication System Documentation

## Overview

Sikapa authentication now supports **username or email login** with one identifier field.

- Login accepts `identifier` (`username` or `email`) + `password`
- Registration requires `username`, `name`, `password`; `email` is optional
- JWT access + refresh tokens (refresh rotates tokens)
- TOTP 2FA, password reset, email verification (only for users with email)

All routes are under `/api/v1/auth`.

## Endpoints

### Registration & login
- `POST /register`
- `POST /login`
- `POST /login-2fa`
- `POST /logout`

### Email verification and reset
- `POST /verify-email`
- `POST /password-reset/request`
- `POST /password-reset/confirm`
- `POST /password/change`

### Token and profile
- `POST /refresh`
- `GET /profile`
- `PUT /profile`

### 2FA
- `POST /2fa/setup`
- `POST /2fa/enable`
- `POST /2fa/disable`
- `GET /2fa/backup-codes`

### Account
- `POST /account/delete`

## Database Models

### User
- id, username (unique), name
- email (optional, unique when present), hashed_password
- first_name/last_name retained temporarily for backward compatibility
- phone
- email_verified, is_active
- two_fa_enabled, two_fa_method
- role (admin/user), is_admin
- created_at, updated_at

### TokenBlacklist
- id, user_id (FK), token
- expires_at (indexed for cleanup)

### OTPCode
- id, user_id (FK), code
- purpose (email_verification, password_reset)
- used, expires_at

### TwoFactorSecret
- id, user_id (FK)
- secret (TOTP), backup_codes (JSON)
- verified, verified_at

### PasswordReset
- id, user_id (FK), token
- used, expires_at

## Security Features

✓ **JWT with Refresh Tokens**
  - Access token TTL: `ACCESS_TOKEN_EXPIRE_MINUTES`
  - Refresh token TTL: `REFRESH_TOKEN_EXPIRE_DAYS`
  - HS256 algorithm
  - Token blacklist for revocation

✓ **Password Security**
  - bcrypt hashing with salt
  - Minimum 8 characters enforced
  - Password reset with expiring tokens

✓ **2FA TOTP**
  - Time-based One Time Password
  - QR code generation for setup
  - 10 backup codes (recovery)
  - TOTP window: ±1 time window

✓ **Email Verification**
  - OTP codes (6 digits)
  - 24-hour expiration
  - One-time use enforcement

✓ **Token Management**
  - Automatic token blacklisting on logout
  - Token expiration validation
  - Separate access/refresh token logic

✓ **Authentication Levels**
  - User (authenticated)
  - Active user (account not disabled)
  - Admin user (role-based access control)

## Request/Response Examples

### Register
```json
POST /register
{
  "username": "john.doe",
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!",
}

Response: { "id": 1, "username": "john.doe", "name": "John Doe", "email": "...", ... }
```

### Login
```json
POST /login
{
  "identifier": "john.doe",
  "password": "SecurePass123!"
}

Response: {
  "access_token": "eyJ0eXAi...",
  "refresh_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### 2FA Setup
```json
POST /2fa/setup (requires Authorization header)
Authorization: Bearer {access_token}

Response: {
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qr_code": "data:image/png;base64,...",
  "backup_codes": ["XXXX-XXXX", "XXXX-XXXX", ...]
}
```

### Refresh Token
```json
POST /refresh
{
  "refresh_token": "eyJ0eXAi..."
}

Response: {
  "access_token": "eyJ0eXAi...",
  "refresh_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "expires_in": 900
}
```

## Service Functions

All business logic implemented in `backend/app/api/v1/auth/services.py`:

- `register_user()` - User registration with OTP generation
- `authenticate_user()` - Email/password validation
- `create_user_tokens()` - JWT token generation
- `refresh_access_token()` - Refresh token logic
- `logout_user()` - Token blacklisting
- `verify_email()` - Email verification with OTP
- `request_password_reset()` - Generate reset token
- `reset_password()` - Password reset with token
- `update_user_profile()` - Profile updates
- `change_password()` - Password change
- `delete_user_account()` - Account deletion (soft)
- `setup_two_fa_totp()` - 2FA secret generation
- `enable_two_fa_totp()` - Enable 2FA after verification
- `disable_two_fa()` - Disable 2FA
- `verify_two_fa_code()` - TOTP code verification
- `get_backup_codes()` - Retrieve backup codes

## Authentication Dependencies

All dependencies in `backend/app/api/v1/auth/dependencies.py`:

- `get_current_user()` - JWT validation + token blacklist check
- `get_current_active_user()` - Ensures account is active
- `get_current_admin_user()` - Ensures admin role

Usage: Add `current_user: User = Depends(get_current_active_user)` to route

## Security Configuration

In `backend/.env`:
```
SECRET_KEY={random_secure_key}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
HTTPS_ENABLED=true
```

## Alembic Migrations

All migrations applied automatically:
- `a83bbcaf54ed` - Add user email field
- `a4011e455772` - Test update
- `b3c2f1a8e9d4` - Add authentication models (TokenBlacklist, OTPCode, TwoFactorSecret, PasswordReset, User columns)

## Testing Status

✓ All imports validated
✓ All database tables created
✓ All 16 endpoints registered
✓ All services available
✓ Database connections working
✓ Migrations applied successfully

## Notes

- Users without email can still register and login, but email-only flows (verification/reset notifications) require an email address.
- If `SECRET_KEY` changes, all existing JWTs become invalid and users must sign in again.

## File Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   └── auth/
│   │       ├── __init__.py
│   │       ├── routes.py (16 endpoints)
│   │       ├── services.py (15 functions)
│   │       ├── schemas.py (20+ Pydantic models)
│   │       └── dependencies.py (3 auth levels)
│   ├── core/
│   │   └── security.py (JWT, TOTP, OTP, passwords)
│   ├── models.py (5 auth models + User)
│   └── main.py
├── alembic/
│   ├── versions/
│   │   ├── a83bbcaf54ed_add_user_email_field.py
│   │   ├── a4011e455772_test_update.py
│   │   └── b3c2f1a8e9d4_add_authentication_models.py
│   └── alembic.ini
└── .env (configuration)
```

## API Base URL

**Development**: http://localhost:8000/api/v1/auth
**Staging**: https://sikapa-backend.onrender.com/api/v1/auth
**Production**: https://api.sikapa.com/v1/auth (when deployed)

## Related Frontend Integration

Frontend environment in `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=https://sikapa-backend.onrender.com/api
```

All auth endpoints available at: `${NEXT_PUBLIC_API_URL}/v1/auth/`
