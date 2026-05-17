# Environment Configuration Guide

This document serves as the central reference for configuring environment variables across all application environments:

- Local Development
- Staging
- Production

Always use the provided `.env.example` files as templates and configure real secrets securely through your hosting platform dashboards such as:

- Render
- Vercel
- Railway
- Supabase
- Docker Secrets
- GitHub Actions Secrets

> Never commit real credentials, API keys, database passwords, or production secrets to version control.

---

# Backend Environment (`backend/.env`)

The backend service depends on the following environment variables for authentication, database connectivity, CORS configuration, email delivery, and payment integrations.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLAlchemy database connection URL. Local example: `sqlite:///./db/sikapa.db`. Production should use PostgreSQL, Supabase, or another managed database provider. |
| `SECRET_KEY` | Yes | Primary signing key used for JWT access and refresh tokens (`HS256`). See the [SECRET_KEY Rotation](#secret_key-rotation) section below. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token lifetime in minutes. Default: `15`. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Refresh token lifetime in days. Default: `7`. |
| `HTTPS_ENABLED` | No | Enables HTTPS awareness internally. Usually `false` locally. Keep `false` on platforms like Render where TLS is terminated upstream. |
| `CORS_ORIGINS` | Yes (for browser clients) | Comma-separated list of allowed frontend origins. Do not include spaces after commas. Example: `https://app.example.com,http://localhost:3000` |
| `CORS_ALLOW_CREDENTIALS` | No | Commonly set to `true` when using authenticated requests, cookies, or credentialed fetch operations. |
| `CORS_ORIGIN_REGEX` | No | Optional regex pattern for handling dynamic preview deployments such as Vercel preview URLs. |
| `FRONTEND_URL` | Recommended | Used when generating password reset and email verification links. |
| `RESEND_API_KEY` | Optional | Required when transactional email functionality is enabled. |
| `PAYSTACK_*` | Optional | Required for Paystack payment processing and checkout flows. |

---

# SECRET_KEY Rotation

The `SECRET_KEY` is critical to the authentication system and must be managed carefully.

Both:
- Access Tokens
- Refresh Tokens

are signed using this value.

## Important Notes

- Rotating the `SECRET_KEY` immediately invalidates all existing JWT tokens.
- Users will be required to sign in again after rotation.
- Previously issued tokens cannot be migrated or recovered.

## Recommended Rotation Procedure

When rotating the production secret key:

1. Deploy the backend with the new `SECRET_KEY`
2. Notify users to log in again
3. Clear stored client tokens if necessary
4. Ensure every backend instance uses the exact same key value

> Avoid inconsistent keys across regions or deployments to prevent authentication failures.

---

# Frontend Environment (`frontend/.env.local`)

The frontend application relies on environment variables for API communication and optional third-party integrations.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Full API v1 base URL. Must end with `/api/v1` and should not include a trailing slash. Example: `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SUPABASE_*` | Optional Supabase client-side configuration values. |
| `NEXT_PUBLIC_WHATSAPP_*` | Optional WhatsApp support or contact integration settings. |

## API URL Requirements

The frontend automatically appends endpoint paths such as:

- `/auth/login`
- `/products/`

Using only `/api` instead of `/api/v1` will break requests due to incorrect routing.

### Correct Example

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Incorrect Example

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Important Notes

- Public environment variables are embedded during build time.
- After changing API URLs or public variables, redeploy the frontend application.

---

# Mobile Environment (Flutter)

The Flutter application does not use `.env` files directly.

Instead, configuration values are injected during build or runtime using:

```bash
--dart-define
```

| Variable | Description |
|----------|-------------|
| `SIKAPA_API_BASE` | Full API v1 base URL used by the mobile app. |
| `SIKAPA_GOOGLE_OAUTH_ENABLED` | Enables the “Continue with Google” authentication button when backend support is configured. |

---

# Platform-Specific API Examples

## Android Emulator

```text
http://10.0.2.2:8000/api/v1
```

## iOS Simulator

```text
http://127.0.0.1:8000/api/v1
```

## Physical Device (LAN)

```text
http://192.168.x.x:8000/api/v1
```

## Production

```text
https://api.your-domain.com/api/v1
```

---

# Flutter Build Examples

## Development

```bash
flutter run --dart-define=SIKAPA_API_BASE=http://10.0.2.2:8000/api/v1
```

## Production APK

```bash
flutter build apk --release \
  --dart-define=SIKAPA_API_BASE=https://api.your-domain.com/api/v1
```

> Changes made through `--dart-define` are compiled into the application binary. Rebuild the app whenever API hosts or runtime values change.

For additional mobile setup instructions, see:

```text
mobile/README.md
```

---

# Production Deployment Checklist

Before deploying to production, verify the following:

- [ ] `SECRET_KEY` is configured and consistent across all deployments
- [ ] `CORS_ORIGINS` includes the exact frontend origin
- [ ] `NEXT_PUBLIC_API_URL` uses the correct production host with `/api/v1`
- [ ] Backend health endpoint returns `200`
- [ ] Authentication clients use the expected login payload structure
- [ ] HTTPS is properly configured
- [ ] Environment secrets are stored securely outside Git

---

# Sensitive Files to Exclude from Git

Never commit the following files:

- `backend/.env`
- `frontend/.env.local`
- Any file containing:
  - API keys
  - Database credentials
  - OAuth secrets
  - JWT signing keys
  - Payment credentials

Use `.env.example` files strictly as templates for local setup and deployment references.

---

# Additional Recommendations

For improved security and maintainability:

- Rotate secrets periodically
- Use separate credentials for staging and production
- Restrict database access by IP when possible
- Enable HTTPS in production environments
- Store secrets in managed secret providers instead of plaintext files
- Audit environment variables regularly

A properly managed environment configuration significantly improves:
- application security
- deployment consistency
- debugging efficiency
- scalability across services