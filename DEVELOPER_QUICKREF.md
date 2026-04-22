# Sikapa Production-Ready Changes - Developer Quick Reference

## What Changed?

### 🔐 Security Fixes

| Change | Location | What to Do |
|--------|----------|-----------|
| `SECRET_KEY` now required | `app/core/security.py` | Set in `.env` - will fail on prod without it |
| Password validation | `app/core/validation.py` | Use `validate_password()` on user input |
| HTML sanitization | `app/core/validation.py` | Use `sanitize_html()` to prevent XSS |
| Timezone-aware datetimes | `app/models.py` | Already updated - check migrations |
| Token validation improved | `app/core/security.py` | Decode functions now return None on error |

### 📊 Database Changes

| Change | Migration | Impact |
|--------|-----------|--------|
| Soft deletes added | New model fields | `deleted_at` field on Product, User, etc. |
| Audit logging | New AuditLog table | Track all admin actions & auth events |
| Timezone fix | All timestamp fields | Run migrations: `alembic upgrade head` |

### 🚨 Error Handling

**Old Way:**
```python
raise HTTPException(status_code=400, detail="Bad request")
```

**New Way:**
```python
from app.core.errors import ValidationError
raise ValidationError(
    message="Email already exists",
    code="VAL_002",
    field="email"
)
```

Response format:
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

### 📝 Logging

**Setup once in main.py:**
```python
from app.core.logging_config import setup_structured_logging
setup_structured_logging(level="INFO", log_json=True)
```

**Use anywhere:**
```python
logger = logging.getLogger(__name__)
logger.info("User action", extra={"user_id": 123, "action": "purchase"})
# Output: JSON with timestamp, level, message, extra fields
```

### 🛡️ Input Validation

```python
from app.core.validation import (
    validate_email,
    validate_password,
    validate_phone,
    validate_amount,
    sanitize_text,
)

# Use in route handlers
try:
    email = validate_email(request.email)
    password = request.password
    validate_password(password)  # Raises ValueError if weak
except ValueError as e:
    raise ValidationError(str(e))
```

### 📋 Audit Logging

**Log important actions:**
```python
from app.core.audit import AuditLogger

AuditLogger.log_user_action(
    session=db,
    user_id=current_user.id,
    action="update",
    resource_type="product",
    resource_id=product.id,
    changes={"price": {"old": 100, "new": 120}},
)
```

### 🎨 Frontend Components

**Error Boundary (wrap pages):**
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

**Loading states:**
```tsx
import { LoadingSpinner, ErrorDisplay, Skeleton } from "@/components/LoadingStates";

// Loading
<LoadingSpinner message="Fetching products..." />

// Error
<ErrorDisplay error={error} title="Failed to load" onDismiss={() => setError(null)} />

// Skeleton
<Skeleton count={5} height="h-12" />
```

---

## Environment Variables

### Backend (.env)

**Must Change:**
```bash
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">
ENVIRONMENT=production
CORS_ORIGINS=https://app.example.com  # Exact domain, no *
DATABASE_URL=postgresql://...
```

**Copy from .env.example:**
- All Paystack keys
- Email settings
- OAuth credentials

### Frontend (.env.local)

**Must Set:**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api  # Include /api
```

**Optional:**
- Google OAuth Client ID
- Paystack public key
- Analytics IDs

---

## Migration Steps

```bash
# 1. Update code
git pull origin main

# 2. Install new dependencies
pip install python-json-logger bleach
npm install

# 3. Create migration for new tables
cd backend
alembic revision --autogenerate -m "Add audit and soft deletes"

# 4. Review migration file (migration/versions/xxx.py)
# Make sure it looks correct

# 5. Apply migration
alembic upgrade head

# 6. Test locally
python -m pytest tests/
npm run test

# 7. Deploy
git push origin main
```

---

## Common Tasks

### Adding a new API endpoint with validation

```python
from fastapi import APIRouter, Depends
from app.core.validation import validate_email
from app.core.errors import ValidationError
from app.core.audit import AuditLogger

router = APIRouter()

@router.post("/users")
async def create_user(request: UserCreate, db: Session = Depends(get_session)):
    # Validate input
    try:
        email = validate_email(request.email)
    except ValueError as e:
        raise ValidationError(str(e), field="email")
    
    # Create user
    user = User(email=email, name=request.name)
    db.add(user)
    db.commit()
    
    # Audit log
    AuditLogger.log_user_action(
        db, current_user.id, "create", "user", user.id
    )
    
    return user
```

### Logging in handlers

```python
import logging
logger = logging.getLogger(__name__)

@router.post("/orders")
async def create_order(req: OrderCreate, user: User):
    logger.info(
        "Creating order",
        extra={"user_id": user.id, "items": len(req.items)}
    )
    # ... order creation logic ...
```

### Catching and handling errors

```python
from app.core.errors import (
    InvalidInputError,
    ResourceNotFoundError,
    DuplicateError,
)

try:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ResourceNotFoundError("User", user_id)
    
    if not user.email_verified:
        raise InvalidInputError("Email not verified", field="email")
        
except IntegrityError:
    raise DuplicateError("email", req.email)
```

---

## Checklist for PRs

- [ ] No hardcoded secrets or defaults
- [ ] Input validation on all user inputs
- [ ] Error responses use new `ErrorResponse` format
- [ ] Important actions logged to audit trail
- [ ] Datetime fields use `timezone.now(timezone.utc)`
- [ ] Frontend components wrapped in ErrorBoundary where appropriate
- [ ] All tests passing
- [ ] ESLint/Mypy passing with zero errors

---

## Monitoring in Production

### Check logs for errors
```bash
# Render: View in dashboard or CLI
render logs --service sikapa-api --tail 100

# See specific error patterns
grep "ERROR" logs.json | jq .
```

### Check audit trail
```sql
SELECT * FROM auditlog 
WHERE created_at > NOW() - INTERVAL 1 DAY 
ORDER BY created_at DESC
LIMIT 20;
```

### Check auth events
```sql
SELECT * FROM auditlog 
WHERE action = 'login' 
AND created_at > NOW() - INTERVAL 1 DAY;
```

---

## Troubleshooting

### Issue: "SECRET_KEY environment variable must be set"
**Solution:** Set `SECRET_KEY` in environment (production only requires this)

### Issue: Audit logs not appearing
**Solution:** Restart app - audit table must exist in DB. Run migration first.

### Issue: CORS errors in browser
**Solution:** Check `CORS_ORIGINS` env var matches frontend domain exactly. No wildcards!

### Issue: Token validation failing
**Solution:** Decode functions now return None. Use `if token_data:` instead of catching exception.

### Issue: Password validation too strict
**Solution:** Increase variety: add uppercase, digits, and special char. Min 8 chars.

---

## Support

- **Docs:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Changes Summary:** `docs/IMPROVEMENTS_SUMMARY.md`
- **Environment Setup:** `backend/.env.example`, `frontend/.env.local.example`

---

**Last Updated:** April 21, 2026  
**Version:** 0.2.0
