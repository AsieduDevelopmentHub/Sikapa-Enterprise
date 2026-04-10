# Backend — Sikapa Enterprise

FastAPI backend for product, auth, and order APIs with enterprise-grade authentication.

## Features

✅ **Complete Authentication System**
- JWT with refresh tokens (15min/7day expiry)
- TOTP 2FA with QR codes + 10 backup codes
- Email verification with OTP codes
- Password reset with secure tokens
- User profile management
- Account deletion (soft delete)
- Token blacklist for logout

✅ **Security**
- bcrypt password hashing
- HTTPS/TLS support
- CORS middleware
- Security headers
- Rate limiting ready

✅ **Database**
- SQLModel ORM (SQLAlchemy + Pydantic)
- PostgreSQL (Supabase) for production
- SQLite for local development
- Alembic migrations

## Quick Start (Local Development)

### 1. Setup Virtual Environment
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Configure Environment
Edit `.env` file:
```bash
# For local development (SQLite)
DATABASE_URL=sqlite:///./db/sikapa.db
HTTPS_ENABLED=false

# For production (Supabase)
# DATABASE_URL=postgresql://...
# HTTPS_ENABLED=true
```

### 3. Start the Server
```bash
# Option 1: Simple startup script
python start_local.py

# Option 2: Direct uvicorn
venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Verify It's Working
```bash
# Health check
curl http://127.0.0.1:8000/health

# API docs
open http://127.0.0.1:8000/docs

# Auth endpoints
curl http://127.0.0.1:8000/api/v1/auth/profile -H "Authorization: Bearer invalid"
```

## API Endpoints

### Authentication (16 endpoints)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/login-2fa` - Login with 2FA
- `POST /api/v1/auth/logout` - Logout (blacklist token)
- `POST /api/v1/auth/verify-email` - Verify email with OTP
- `POST /api/v1/auth/password-reset/request` - Request password reset
- `POST /api/v1/auth/password-reset/confirm` - Reset password
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/password/change` - Change password
- `POST /api/v1/auth/2fa/setup` - Setup 2FA (get QR code)
- `POST /api/v1/auth/2fa/enable` - Enable 2FA
- `POST /api/v1/auth/2fa/disable` - Disable 2FA
- `GET /api/v1/auth/2fa/backup-codes` - Get backup codes
- `POST /api/v1/auth/account/delete` - Delete account

### Products (coming soon)
- Product CRUD operations
- Search and filtering
- Categories and inventory

## Directory Structure

```
backend/
├── app/               # Application code
│   ├── api/v1/       # Versioned API endpoints
│   │   ├── auth/     # Authentication (routes, schemas, services)
│   │   └── products/ # Products (routes, schemas, services)
│   ├── core/         # Core utilities (security, config)
│   ├── db.py         # Database configuration
│   ├── models.py     # SQLModel definitions
│   └── main.py       # FastAPI app entry point
├── alembic/          # Database migrations
├── certs/            # SSL certificates for HTTPS
├── db/               # Local SQLite database
├── docs/             # Documentation
└──  tools/            # Utility scripts
```

## Database Setup

### Local Development (SQLite)
```bash
# Database file created automatically at: backend/db/sikapa.db
# Tables created on startup via SQLModel.metadata.create_all()
```

### Production (PostgreSQL + Supabase)
```bash
# Set DATABASE_URL in .env
# Run migrations: alembic upgrade head
```

## Environment Variables

```bash
# Database
DATABASE_URL=sqlite:///./db/sikapa.db

# Security
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# HTTPS
HTTPS_ENABLED=false
SSL_CERT_PATH=certs/server.crt
SSL_KEY_PATH=certs/server.key

# CORS
CORS_ORIGINS=http://localhost:3000,https://localhost:3000
CORS_ALLOW_CREDENTIALS=true

# Email (optional)
RESEND_API_KEY=your-resend-api-key
```

## Deploy to Render

This backend can be deployed to Render using the Dockerfile.

- **Environment**: `Docker`
- **Dockerfile path**: `backend/Dockerfile`
- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables**: Set `HTTPS_ENABLED=false` (Render handles TLS)

## Testing

```bash
# Run all tests
pytest

# Run auth tests specifically
pytest tests/test_auth.py

# Test authentication system
python test_auth_system.py
```

## Documentation

- [Authentication API Reference](docs/API_REFERENCE.md)
- [Authentication System Guide](docs/AUTHENTICATION.md)
- [TLS/HTTPS Setup](docs/tls/)
- [Migration Guide](docs/migration/)

## Troubleshooting

### Backend won't start
1. Check if virtual environment is activated: `venv\Scripts\activate`
2. Verify dependencies: `pip install -r requirements.txt`
3. Check database: ensure `db/` directory exists
4. Check environment: verify `.env` file exists

### Database connection errors
1. For local dev: ensure `DATABASE_URL=sqlite:///./db/sikapa.db`
2. For production: verify Supabase credentials
3. Run migrations: `alembic upgrade head`

### Authentication not working
1. Check JWT secret key in `.env`
2. Verify token format: `Bearer {token}`
3. Check token expiry (15 minutes for access tokens)

### CORS errors
1. Add frontend URL to `CORS_ORIGINS` in `.env`
2. Set `CORS_ALLOW_CREDENTIALS=true` for auth cookies

See `backend/docs/hosting/render.md` for more details.

## Database migrations

### Alembic CLI Commands

**Initialize migrations** (one-time setup):
```bash
alembic init alembic
```

**Create a new auto-generated migration** (after modifying models):
```bash
alembic revision --autogenerate -m "add new_column to users"
```

**Create an empty migration** (for manual SQL):
```bash
alembic revision -m "manual migration description"
```

**Upgrade to latest migration**:
```bash
alembic upgrade head
```

**Upgrade to specific revision**:
```bash
alembic upgrade abc123def  # Use revision ID
```

**Downgrade one revision**:
```bash
alembic downgrade -1
```

**Downgrade to specific revision**:
```bash
alembic downgrade abc123def
```

**Show current revision**:
```bash
alembic current
```

**Show migration history**:
```bash
alembic history
```

**Validate SQL syntax** (dry run):
```bash
alembic upgrade head --sql
```

### Python Code for Migrations

Create `backend/migration/migrations.py`:
```python
from alembic.config import Config
from alembic.command import upgrade, downgrade, current, history

def run_migrations(direction: str = "upgrade"):
    """Run pending migrations"""
    alembic_cfg = Config("alembic.ini")
    if direction == "upgrade":
        upgrade(alembic_cfg, "head")
    elif direction == "downgrade":
        downgrade(alembic_cfg, "-1")

def get_current_revision() -> str:
    """Get current database revision"""
    alembic_cfg = Config("alembic.ini")
    ctx = current(alembic_cfg)
    return ctx

def get_migration_history():
    """Get all migration revisions"""
    alembic_cfg = Config("alembic.ini")
    history(alembic_cfg)

def auto_upgrade_on_startup():
    """Automatically upgrade database on app startup"""
    try:
        run_migrations("upgrade")
        print("✓ Database migrations applied successfully")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
```

Use in `backend/app/main.py`:
```python
from migration.migrations import auto_upgrade_on_startup

@app.on_event("startup")
async def startup_event():
    auto_upgrade_on_startup()
    create_db_and_tables()
```

### Development Workflow

1. **Modify a model** in `app/models.py`
2. **Generate migration**:
   ```bash
   alembic revision --autogenerate -m "descriptive message"
   ```
3. **Review generated migration** in `alembic/versions/`
4. **Apply migration**:
   ```bash
   alembic upgrade head
   ```
5. **Test the changes** with your app

## Testing

```bash
cd backend
venv\Scripts\activate
pytest
```

## Notes

- Database files are stored in `db/` folder (SQLite by default)
- SQL schemas and raw migrations are in `migrations/` folder
- Alembic auto-migrations are in `alembic/` folder
- Update `DATABASE_URL` in `.env` for PostgreSQL or Supabase
- Use `alembic upgrade head` before running the application for the first time
