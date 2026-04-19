# Authentication session behavior & admin access

This document reflects **current** storefront + API behavior for sessions and administrative roles.

---

## Browser session: “Keep me signed in”

On **Email/username sign-in** and **Register**, the account screen includes **Keep me signed in on this device**.

| Checkbox | Where tokens are stored | Typical lifetime |
|----------|-------------------------|------------------|
| **Checked** (default) | `localStorage` | Until the user signs out or clears site data; survives closing the browser. Refresh tokens follow `REFRESH_TOKEN_EXPIRE_DAYS` on the API (often ~7 days unless rotated sooner). |
| **Unchecked** | `sessionStorage` only | Until the tab/window session ends (closing the browser usually clears this). |

Implementation:

- Keys: `sikapa_access_token`, `sikapa_refresh_token`.
- Bucket marker: `sikapa_auth_bucket` (`local` | `session`) so the client knows which store is authoritative.
- **401** retries use `POST /api/v1/auth/refresh` with the refresh token from the **same** bucket.

**Google OAuth** (“Continue with Google”) stores tokens in **localStorage** (persistent) and notifies the app so the signed-in user loads without a manual refresh.

---

## JWT lifetimes (API)

Controlled in `backend/.env`:

- `ACCESS_TOKEN_EXPIRE_MINUTES` — short-lived bearer for API calls (often ~15 minutes).
- `REFRESH_TOKEN_EXPIRE_DAYS` — used with `/auth/refresh`; rotation returns new access + refresh tokens.

See also [OPERATIONS.md](./OPERATIONS.md) (JWT section).

---

## Admin roles & permissions (RBAC)

Backend model fields on `User`:

- `is_admin` — must be true for any admin-panel access.
- `admin_role` — `customer` | `staff` | `admin` | `super_admin`.
- `admin_permissions` — comma-separated permission keys (ignored for `super_admin`, which bypasses checks).

Route guards use `require_admin_permission("<key>")` in `backend/app/api/v1/auth/dependencies.py`.  
**`super_admin`** bypasses individual permission checks.

Canonical permission keys and labels are defined in:

- `backend/app/api/v1/admin/permission_catalog.py`

Admin API highlights:

- `GET /api/v1/admin/users/permission-catalog` — keys + labels for UIs.
- `POST /api/v1/admin/users/staff-accounts` — create a staff/admin login (requires `manage_staff`).
- `PATCH /api/v1/admin/users/{id}/staff-role` — role + permission list.

Only another **`super_admin`** may assign or modify **`super_admin`** accounts or revoke their admin access.

The **Admin → Staff** page in the frontend (`/admin/staff`) drives these flows.

---

## Related docs

| Topic | Location |
|--------|-----------|
| Env vars | [ENVIRONMENT.md](./ENVIRONMENT.md) |
| CORS, health, troubleshooting | [OPERATIONS.md](./OPERATIONS.md) |
| Auth endpoints & schemas (API detail) | [../backend/docs/AUTHENTICATION.md](../backend/docs/AUTHENTICATION.md) |
