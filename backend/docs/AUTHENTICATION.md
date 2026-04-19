# Authentication & authorization

Sikapa uses **username or email** for login, **JWT access + refresh** tokens, optional **TOTP 2FA**, **Google OAuth**, and **granular admin RBAC** for the admin panel.

All auth routes are under **`/api/v1/auth`**. Admin user-management routes are under **`/api/v1/admin/users`**.

---

## Endpoints (auth)

### Registration & session

| Method | Path | Notes |
|--------|------|--------|
| POST | `/register` | `username`, `name`, `password`; optional `email` |
| POST | `/login` | `identifier` (username or email), `password` |
| POST | `/login-2fa` | After login when TOTP is enabled |
| POST | `/logout` | Blacklists access token; client should discard stored tokens |
| POST | `/refresh` | Body: `{ "refresh_token": "..." }` — returns rotated tokens |

### Email & password

| POST | Path |
|------|------|
| `/verify-email` | OTP flow when email is present |
| `/resend-email-verification` | |
| `/password-reset/request` | |
| `/password-reset/confirm` | |
| `/password/change` | Authenticated |

### Profile & account

| GET/PUT | `/profile` | |
| POST | `/account/delete` | |

### Google OAuth

| GET | `/google/start` | Redirects to Google |
| GET | `/google/callback` | Server-side; issues tokens (see frontend callback on web) |
| POST | `/google/verify-2fa` | When Google sign-in + TOTP on account |

### 2FA (TOTP)

| POST | `/2fa/setup` | |
| POST | `/2fa/enable` | |
| POST | `/2fa/disable` | |
| GET | `/2fa/backup-codes` | |

---

## User model (relevant fields)

On table `user` (see `backend/app/models.py`):

| Field | Purpose |
|-------|---------|
| `username`, `name`, `email` | `email` optional but unique when set |
| `hashed_password` | bcrypt |
| `google_sub` | Google “sub”; unique when set |
| `email_verified`, `is_active` | |
| `is_admin` | Must be true for admin UI |
| `admin_role` | `customer`, `staff`, `admin`, or `super_admin` |
| `admin_permissions` | Comma-separated permission keys; `super_admin` bypasses checks |
| `two_fa_enabled`, `two_fa_method` | |

Supporting tables include `TokenBlacklist`, `OTPCode`, `TwoFactorSecret`, `PasswordReset` (see models and Alembic migrations).

---

## Admin RBAC

- **`super_admin`**: full admin access; bypasses `admin_permissions` checks.
- **`admin` / `staff`**: must have required keys in `admin_permissions` for each protected route (`require_admin_permission("...")` in `app/api/v1/auth/dependencies.py`).
- Permission catalog: `app/api/v1/admin/permission_catalog.py`.

**Staff / admin APIs** (selection):

| Method | Path | Permission (typical) |
|--------|------|----------------------|
| GET | `/admin/users/permission-catalog` | `manage_staff` |
| POST | `/admin/users/staff-accounts` | `manage_staff` |
| PATCH | `/admin/users/{id}/staff-role` | `manage_staff` |

Only **`super_admin`** may assign `super_admin` or alter another super admin’s access.

---

## Security features (summary)

- **JWT** access (short TTL) + refresh (longer TTL, rotation on refresh).
- **Token blacklist** on logout and for revoked access tokens where applicable.
- **bcrypt** password hashing; minimum password length enforced (e.g. 8 chars on register).
- **TOTP 2FA** optional; backup codes supported in services.
- **Email verification** via OTP when email is provided at registration.

---

## Environment (`backend/.env`)

```env
SECRET_KEY=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

If **`SECRET_KEY`** changes, existing JWTs are invalid and users must sign in again.

---

## Service layer

Primary implementation: `backend/app/api/v1/auth/services.py` (registration, login, tokens, refresh, profile, 2FA, password flows).

---

## Request/response examples

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "john.doe",
  "password": "SecurePass123!"
}
```

```json
{
  "access_token": "eyJ0eXAi...",
  "refresh_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Refresh

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ0eXAi..."
}
```

---

## Frontend integration

- API base: `NEXT_PUBLIC_API_URL` (must include `/api`; the client appends `/v1/...`).
- Session storage behavior (“Keep me signed in”) and admin overview: **[../../docs/AUTH_SESSION_AND_ADMIN.md](../../docs/AUTH_SESSION_AND_ADMIN.md)**.

---

## Interactive API docs

With the server running: `http://localhost:8000/docs` (Swagger UI).
