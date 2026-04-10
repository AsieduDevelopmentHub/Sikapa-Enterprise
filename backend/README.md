# Backend — Sikapa Enterprise

FastAPI backend for product, auth, and order APIs.

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
├── alembic/          # Database migrations configuration
├── dbschemas/        # SQL schema files
├── db/               # Database files (SQLite)
├── migration/        # Python migration utilities and CLI
└── tests/            # Unit and integration tests
```

## Run locally

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

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
