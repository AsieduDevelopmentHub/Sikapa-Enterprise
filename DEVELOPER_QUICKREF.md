# Sikapa Production Readiness Guide
## Developer Quick Reference

This document provides a practical overview of the latest production-focused improvements introduced across the Sikapa platform.

It is intended as a quick reference for:
- Backend developers
- Frontend developers
- Mobile developers
- DevOps contributors
- CI/CD maintainers

---

# Overview

The platform has now moved toward a more production-oriented architecture with improvements focused on:

- Security hardening
- Validation consistency
- Structured error handling
- Audit logging
- Better observability
- Environment safety
- CI/CD stability
- Mobile release automation
- Database reliability
- Frontend resilience

---

# Security Improvements

## JWT & Authentication

| Change | Location | Notes |
|--------|----------|-------|
| `SECRET_KEY` required | `app/core/security.py` | Application will fail securely if missing in production |
| Improved token validation | `app/core/security.py` | Decode functions now safely return `None` on invalid tokens |
| Token rotation awareness | Auth layer | Changing `SECRET_KEY` invalidates all sessions |
| Environment-based security | `.env` | Secrets now expected through deployment providers |

---

## Input Validation & Sanitization

| Feature | Location | Purpose |
|--------|----------|---------|
| Password validation | `app/core/validation.py` | Prevent weak passwords |
| Email validation | `app/core/validation.py` | Normalize and validate email structure |
| Phone validation | `app/core/validation.py` | Validate supported formats |
| Amount validation | `app/core/validation.py` | Prevent invalid payment values |
| HTML sanitization | `app/core/validation.py` | Prevent XSS injection attacks |
| Text sanitization | `app/core/validation.py` | Clean user-provided input safely |

### Example Usage

```python
from app.core.validation import (
    validate_email,
    validate_password,
    validate_phone,
    validate_amount,
    sanitize_text,
)

try:
    email = validate_email(request.email)

    validate_password(request.password)

except ValueError as e:
    raise ValidationError(str(e))
```

---

# Database Improvements

## Timezone-Aware Datetimes

All major timestamp fields now use timezone-aware UTC datetimes.

### Benefits
- Safer distributed deployments
- Accurate audit trails
- Better cross-region consistency
- Proper API serialization

### Action Required

Run database migrations:

```bash
alembic upgrade head
```

---

## Soft Deletes

Soft delete support has been added to important models.

### Examples
- User
- Product
- Order
- Inventory entities

### New Field

```python
deleted_at
```

### Benefits
- Safer recovery
- Historical tracking
- Better audit support
- Reduced accidental data loss

---

## Audit Logging System

A centralized audit logging system has been introduced.

### Tracks
- Authentication events
- Admin actions
- Product changes
- User management actions
- Sensitive system operations

### Example

```python
from app.core.audit import AuditLogger

AuditLogger.log_user_action(
    session=db,
    user_id=current_user.id,
    action="update",
    resource_type="product",
    resource_id=product.id,
    changes={
        "price": {
            "old": 100,
            "new": 120,
        }
    },
)
```

---

# Structured Error Handling

The platform now uses centralized structured API errors.

---

## Previous Approach

```python
raise HTTPException(
    status_code=400,
    detail="Bad request"
)
```

---

## Current Approach

```python
from app.core.errors import ValidationError

raise ValidationError(
    message="Email already exists",
    code="VAL_002",
    field="email",
)
```

---

## Standardized Error Response

```json
{
  "success": false,
  "error": {
    "code": "VAL_002",
    "message": "Email already exists",
    "field": "email"
  }
}
```

---

# Logging & Observability

Structured logging is now supported across backend services.

---

## Setup

```python
from app.core.logging_config import setup_structured_logging

setup_structured_logging(
    level="INFO",
    log_json=True,
)
```

---

## Usage

```python
import logging

logger = logging.getLogger(__name__)

logger.info(
    "User action",
    extra={
        "user_id": 123,
        "action": "purchase",
    },
)
```

### Benefits
- JSON-compatible logs
- Better monitoring support
- Easier production debugging
- Compatible with Render, ELK, Datadog, Grafana, etc.

---

# Frontend Stability Improvements

## Error Boundaries

Wrap critical pages with:

```tsx
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

---

## Loading & Error Components

```tsx
import {
  LoadingSpinner,
  ErrorDisplay,
  Skeleton,
} from "@/components/LoadingStates";
```

### Loading

```tsx
<LoadingSpinner message="Fetching products..." />
```

### Error

```tsx
<ErrorDisplay
  error={error}
  title="Failed to load"
  onDismiss={() => setError(null)}
/>
```

### Skeletons

```tsx
<Skeleton count={5} height="h-12" />
```

---

# Mobile Infrastructure Improvements

The Flutter mobile pipeline now supports:

- Automated Android builds
- Automated iOS validation builds
- GitHub Release publishing
- Artifact uploads
- Runtime configuration injection
- Gradle caching
- Flutter version pinning
- Automated testing and analysis

---

## Mobile Runtime Configuration

Flutter now uses:

```bash
--dart-define
```

instead of `.env` files.

### Examples

```bash
flutter run \
  --dart-define=SIKAPA_API_BASE=http://10.0.2.2:8000/api/v1
```

```bash
flutter build apk --release \
  --dart-define=SIKAPA_API_BASE=https://api.example.com/api/v1
```

---

# Environment Configuration

## Backend (`backend/.env`)

### Required

```env
SECRET_KEY=<secure-random-secret>
DATABASE_URL=postgresql://...
ENVIRONMENT=production
CORS_ORIGINS=https://app.example.com
```

### Important Notes

- Never use wildcard CORS in production
- Use HTTPS-only frontend origins
- Keep secrets outside Git
- Use deployment providers for secret management

---

## Frontend (`frontend/.env.local`)

### Required

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

### Important

The API URL must:
- include `/api/v1`
- not include a trailing slash
- match the backend origin exactly

---

## Mobile

The Flutter app reads configuration using:

```bash
--dart-define
```

### Variables

| Variable | Purpose |
|----------|---------|
| `SIKAPA_API_BASE` | Full API base URL |
| `SIKAPA_GOOGLE_OAUTH_ENABLED` | Toggle Google OAuth UI |

---

# Migration Workflow

## Backend Migration Process

```bash
# Pull latest changes
git pull origin main

# Install dependencies
pip install -r requirements.txt

# Frontend dependencies
npm install

# Generate migration
cd backend

alembic revision --autogenerate \
  -m "Production infrastructure updates"

# Review migration carefully
# migration/versions/*.py

# Apply migration
alembic upgrade head
```

---

# Testing Workflow

## Backend

```bash
pytest tests/
```

---

## Frontend

```bash
npm run lint
npm run test
```

---

## Mobile

```bash
flutter analyze
flutter test
```

---

# Common Development Patterns

## Creating Validated Endpoints

```python
from fastapi import APIRouter, Depends
from app.core.validation import validate_email
from app.core.errors import ValidationError

router = APIRouter()

@router.post("/users")
async def create_user(
    request: UserCreate,
    db: Session = Depends(get_session),
):
    try:
        email = validate_email(request.email)

    except ValueError as e:
        raise ValidationError(
            message=str(e),
            field="email",
        )

    user = User(
        email=email,
        name=request.name,
    )

    db.add(user)
    db.commit()

    return user
```

---

## Logging in Route Handlers

```python
import logging

logger = logging.getLogger(__name__)

logger.info(
    "Creating order",
    extra={
        "user_id": user.id,
        "items": len(req.items),
    },
)
```

---

## Handling Database Errors

```python
from app.core.errors import (
    InvalidInputError,
    ResourceNotFoundError,
    DuplicateError,
)

try:
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise ResourceNotFoundError(
            "User",
            user_id,
        )

except IntegrityError:
    raise DuplicateError(
        "email",
        req.email,
    )
```

---

# CI/CD & Deployment Improvements

The platform now includes:
- Automated mobile builds
- Tagged release publishing
- Workflow artifact uploads
- Build caching
- Static analysis enforcement
- Unit test validation
- Flutter version pinning
- Concurrent workflow protection

---

# Pull Request Checklist

Before merging:

- [ ] No hardcoded secrets
- [ ] Validation added for user input
- [ ] Structured errors implemented
- [ ] Audit logs added where required
- [ ] UTC timezone-aware datetimes used
- [ ] Frontend error boundaries added
- [ ] Mobile builds passing
- [ ] CI/CD checks passing
- [ ] Tests passing
- [ ] Linting passing
- [ ] Migrations reviewed

---

# Production Monitoring

## View Logs

```bash
render logs --service sikapa-api --tail 100
```

---

## Filter Errors

```bash
grep "ERROR" logs.json | jq .
```

---

## Recent Audit Events

```sql
SELECT *
FROM auditlog
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Authentication Activity

```sql
SELECT *
FROM auditlog
WHERE action = 'login'
AND created_at > NOW() - INTERVAL '1 day';
```

---

# Troubleshooting

## SECRET_KEY Missing

### Problem

```text
SECRET_KEY environment variable must be set
```

### Solution

Set a valid production secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Audit Logs Not Appearing

### Solution

- Ensure migrations were applied
- Restart backend services
- Confirm `auditlog` table exists

---

## CORS Errors

### Solution

Ensure:

```env
CORS_ORIGINS=https://yourdomain.com
```

matches the frontend origin exactly.

---

## Token Validation Failures

Decode helpers now safely return:

```python
None
```

Always check:

```python
if token_data:
```

instead of relying only on exceptions.

---

# Documentation References

| Document | Purpose |
|----------|---------|
| `docs/PRODUCTION_DEPLOYMENT.md` | Deployment procedures |
| `docs/IMPROVEMENTS_SUMMARY.md` | Full production changes |
| `docs/ENVIRONMENT.md` | Environment configuration |
| `mobile/README.md` | Flutter mobile setup |
| `backend/.env.example` | Backend environment template |

---

# Current Platform Status

### Backend
- Production-oriented authentication
- Structured validation
- Audit logging
- Soft deletes
- Improved observability

### Frontend
- Better loading/error handling
- Error boundaries
- Cleaner API integration

### Mobile
- Automated CI/CD
- Tagged release automation
- Runtime environment injection
- Android + iOS build support

### Infrastructure
- Environment-based configuration
- Structured logging
- Safer deployment workflows
- Improved release management

---

**Last Updated:** May 18, 2026  
**Platform Version:** 0.2.1