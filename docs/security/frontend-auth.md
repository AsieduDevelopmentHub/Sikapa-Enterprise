# Frontend authentication security model (F-001)

How Sikapa web stores credentials and what operators should know.

## Token storage

| Token | Storage | Notes |
|-------|---------|-------|
| Access JWT | `localStorage` or `sessionStorage` | Bucket chosen by “Remember me” (`lib/auth-storage.ts`) |
| Refresh JWT | Same bucket as access | Cleared on logout |
| Admin session flag | HttpOnly cookie `sikapa_session` | Set via `/api/auth/session`; used by `proxy.ts` for server-side admin gate |

Access and refresh tokens are **not** HttpOnly. Any XSS on the storefront origin can read them from storage. Mitigations in place:

- Strict CSP on API responses (`main.py` security headers)
- Next.js/React escaping by default; sanitize user HTML where rendered
- Admin routes additionally gated server-side via cookie + JWT `is_admin` claim

## HttpOnly admin cookie

On login, the client POSTs the access token to `/api/auth/session`, which validates it and sets `sikapa_session` (HttpOnly, `SameSite=Lax`, `Secure` in production). The proxy reads this cookie to redirect non-admins away from `/admin/*` before the page renders.

Shopper routes (checkout, orders) still rely on client-side auth context; API endpoints enforce authorization regardless.

## Recommendations for production

1. Keep `NEXT_PUBLIC_*` vars free of secrets.
2. Enable Sentry on frontend (`SENTRY_DSN`) to catch client errors.
3. Do not disable CSP or inject untrusted third-party scripts on auth/checkout pages.
4. Rotate `SECRET_KEY` on backend if a token leak is suspected; users must re-login.

See also [security-policy.md](../security/security-policy.md) and backend [startup_checks.py](../../backend/app/core/startup_checks.py).
