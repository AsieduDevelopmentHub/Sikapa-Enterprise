# Authentication System Documentation

## Overview
Complete enterprise-grade authentication system for Sikapa platform with JWT, 2FA TOTP, email verification, password reset, and token management.

## Implemented Endpoints (16 total)

### Registration & Login
- **POST /register** - Register new user with email verification OTP
- **POST /login** - Login with email/password, returns JWT tokens
- **POST /login-2fa** - Login with 2FA verification code when 2FA enabled
- **POST /logout** - Logout and blacklist current token

### Email Verification  
- **POST /verify-email** - Verify email address with OTP code

### Password Management
- **POST /password-reset/request** - Request password reset (sends link to email)
- **POST /password-reset/confirm** - Reset password with reset token
- **POST /password/change** - Change password (authenticated users only)

### Token Management
- **POST /refresh** - Refresh access token using refresh token

### Profile Management
- **GET /profile** - Get current user profile
- **PUT /profile** - Update user profile (name, phone, etc.)

### 2FA TOTP Management  
- **POST /2fa/setup** - Generate TOTP secret and QR code
- **POST /2fa/enable** - Enable 2FA after verification
- **POST /2fa/disable** - Disable 2FA (requires password)
- **GET /2fa/backup-codes** - Get backup codes for 2FA

### Account Management
- **POST /account/delete** - Delete user account (soft delete)

## Database Models

### User
- id, email (unique), hashed_password
- first_name, last_name, phone
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
  - Access tokens: 15 minutes
  - Refresh tokens: 7 days
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
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}

Response: { "id": 1, "email": "...", "email_verified": false, ... }
```

### Login
```json
POST /login
{
  "email": "user@example.com",
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

## Next Steps

### Remaining Tasks:
1. Rate limiting on auth endpoints
2. Comprehensive endpoint testing
3. Frontend integration
4. Email service integration (Resend API)
5. Backup code regeneration endpoint
6. Session management
7. Device tracking for 2FA

### Production Considerations:
- Enable HTTPS/TLS on production
- Store secrets in secure vaults
- Implement rate limiting
- Add request logging/monitoring
- Database automatic backups
- Token expiration cleanup job
- Email template system
- SMS 2FA option
- Biometric authentication

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
