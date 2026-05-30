# Sikapa Authentication API - Quick Reference

## Base URL
```
https://sikapa-backend.onrender.com/api/v1/auth
```

## Authentication Header
All authenticated endpoints require:
```
Authorization: Bearer {access_token}
```

---

## 1. User Registration
```
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MinimumPassword123",
  "first_name": "John",
  "last_name": "Doe"
}

Response (201):
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "email_verified": false,
  "two_fa_enabled": false,
  "is_active": true
}

Note: After registration, user receives OTP via email for email verification
```

---

## 2. User Login
```
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MinimumPassword123"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}

Note: If 2FA enabled, use /login-2fa instead with 'code' field
```

---

## 3. Login with 2FA
```
POST /login-2fa
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MinimumPassword123",
  "code": "123456"
}

Response (200):
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "token_type": "bearer",
  "expires_in": 900
}
```

---

## 4. Refresh Access Token
```
POST /refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "access_token": "eyJhbG... NEW TOKEN ...",
  "token_type": "bearer",
  "expires_in": 900
}
```

---

## 5. Logout
```
POST /logout
Authorization: Bearer {access_token}

Response (200):
{
  "message": "Logout successful"
}

Note: Token is blacklisted and can no longer be used
```

---

## 6. Verify Email
```
POST /verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}

Response (200):
{
  "message": "Email verified successfully",
  "email": "user@example.com",
  "verified": true
}
```

---

## 7. Request Password Reset
```
POST /password-reset/request
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "message": "If email exists, reset link has been sent"
}

Note: User receives password reset link with token via email
```

---

## 8. Confirm Password Reset
```
POST /password-reset/confirm
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword123"
}

Response (200):
{
  "message": "Password reset successfully",
  "email": "user@example.com"
}
```

---

## 9. Get User Profile
```
GET /profile
Authorization: Bearer {access_token}

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "email_verified": true,
  "two_fa_enabled": true,
  "two_fa_method": "totp",
  "is_active": true,
  "created_at": "2026-04-10T10:00:00",
  "updated_at": "2026-04-10T11:00:00"
}
```

---

## 10. Update User Profile
```
PUT /profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "Jonathan",
  "last_name": "Smith",
  "phone": "+9876543210"
}

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Jonathan",
  "last_name": "Smith",
  "phone": "+9876543210",
  ...
}
```

---

## 11. Change Password
```
POST /password/change
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "current_password": "OldPassword123",
  "new_password": "NewPassword456"
}

Response (200):
{
  "message": "Password changed successfully"
}
```

---

## 12. Setup 2FA TOTP
```
POST /2fa/setup
Authorization: Bearer {access_token}

Response (200):
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backup_codes": [
    "XXXX-XXXX",
    "XXXX-XXXX",
    ...
  ]
}

Steps:
1. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
2. Verify with OTP code from app
3. Save backup codes securely
4. Call /2fa/enable to confirm
```

---

## 13. Enable 2FA
```
POST /2fa/enable
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "backup_codes": ["XXXX-XXXX", "XXXX-XXXX", ...],
  "verification_code": "123456"
}

Response (200):
{
  "message": "2FA enabled successfully",
  "two_fa_enabled": true,
  "two_fa_method": "totp"
}
```

---

## 14. Disable 2FA
```
POST /2fa/disable
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "password": "CurrentPassword123"
}

Response (200):
{
  "message": "2FA disabled successfully",
  "two_fa_enabled": false
}
```

---

## 15. Get 2FA Backup Codes
```
GET /2fa/backup-codes
Authorization: Bearer {access_token}

Response (200):
{
  "backup_codes": [
    "XXXX-XXXX",
    "XXXX-XXXX",
    ...
  ]
}

Note: Use a backup code as TOTP when your authenticator is unavailable
```

---

## 16. Delete Account
```
POST /account/delete
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "password": "ConfirmPassword123"
}

Response (200):
{
  "message": "Account deleted successfully"
}

Note: This is a soft delete - account is marked as inactive
```

---

## Error Responses

### Invalid Credentials (401)
```json
{
  "detail": "Invalid email or password"
}
```

### Missing Authorization (401)
```json
{
  "detail": "Missing or invalid authorization header"
}
```

### User Not Found (404)
```json
{
  "detail": "User not found"
}
```

### Email Already Registered (400)
```json
{
  "detail": "Email already registered"
}
```

### Invalid Token (401)
```json
{
  "detail": "Invalid token"
}
```

### User Inactive (403)
```json
{
  "detail": "User account is inactive"
}
```

### Token Expired (401)
```json
{
  "detail": "Token has been revoked"
}
```

---

## Token Details

**Access Token:**
- Duration: 15 minutes
- Used for API requests
- Include in Authorization header

**Refresh Token:**
- Duration: 7 days
- Used to request new access token
- Never include in Authorization header

**Token Format:** JWT (JSON Web Token)
- Algorithm: HS256
- Payload contains: email (sub), expiration (exp)

---

## Security Best Practices

✓ Store tokens in secure storage (HTTP-only cookies recommended)
✓ Never expose tokens in URL parameters
✓ Use HTTPS for all requests
✓ Rotate refresh tokens periodically
✓ Clear tokens on logout
✓ Validate token expiration before use
✓ Enable 2FA for additional security
✓ Use strong passwords (min 8 characters)
✓ Update profile information regularly

---

## Rate Limiting

Current rate limits (per IP):
- **Auth endpoints**: 10 requests/minute
- **Token refresh**: 5 requests/minute
- **Login attempts**: 5 failed attempts triggers 15-minute lockout

---

## Frontend Integration Example (JavaScript)

```javascript
// Login
const response = await fetch('https://sikapa-backend.onrender.com/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { access_token, refresh_token } = await response.json();

// Store tokens
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// Use in API requests
const apiResponse = await fetch('https://sikapa-backend.onrender.com/api/v1/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

// Refresh token when expired
if (apiResponse.status === 401) {
  const refreshResponse = await fetch('https://sikapa-backend.onrender.com/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: localStorage.getItem('refresh_token')
    })
  });
  const newTokens = await refreshResponse.json();
  localStorage.setItem('access_token', newTokens.access_token);
}
```

---

## Support & Documentation

- Full docs: `/backend/docs/AUTHENTICATION.md`
- Source code: `/backend/app/api/v1/auth/`
- Models: `/backend/app/models.py`
- Database schema: Alembic migrations in `/backend/alembic/versions/`

---

**Last Updated**: 2026-04-10
**API Version**: v1
**Status**: ✓ Fully Operational
