# Alembic & Migration Quick Reference

## CLI Commands (Run in `backend/` directory with venv activated)

### Create Migrations
```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "add_user_email_field"

# Empty migration (for manual SQL)
alembic revision -m "custom migration"
```

### Apply Migrations
```bash
# Upgrade to latest
alembic upgrade head

# Upgrade to specific revision
alembic upgrade 1ab2c3d4e5f6

# Upgrade N steps forward
alembic upgrade +2
```

### Revert Migrations
```bash
# Downgrade one step
alembic downgrade -1

# Downgrade N steps
alembic downgrade -2

# Downgrade to specific revision
alembic downgrade 1ab2c3d4e5f6

# Downgrade to base (all undone)
alembic downgrade base
```

### Inspect Migrations
```bash
# Show current revision
alembic current

# Show all revisions
alembic history

# Show next revision
alembic current --verbose

# Dry run - show SQL without applying
alembic upgrade head --sql
```

## Python Management Script

Run from `backend/` directory:

```bash
# Upgrade all
python migration/manage.py migrate

# Upgrade to specific revision
python migration/manage.py migrate abc123def

# Downgrade one step
python migration/manage.py rollback

# Downgrade N steps
python migration/manage.py rollback -2

# Create auto migration
python migration/manage.py makemigrations

# Create manual migration
python migration/manage.py makemigrations "my custom migration"

# Show current revision
python migration/manage.py current

# Validate migration SQL
python migration/manage.py validate

# Show help
python migration/manage.py help
```

## Python Code (In your app)

```python
from migration.migrations import (
    upgrade_database,
    downgrade_database,
    create_migration,
    get_current_revision,
    auto_upgrade_on_startup
)

# Upgrade to latest
upgrade_database("head")

# Downgrade one step
downgrade_database("-1")

# Create new migration
create_migration("add product reviews table")

# Get current revision
current = get_current_revision()
print(f"Current revision: {current}")

# Auto-upgrade on app startup
auto_upgrade_on_startup()
```

## Workflow Example

1. **Modify a model** in `app/models.py`:
```python
class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    rating: int = 0  # NEW FIELD
```

2. **Generate migration**:
```bash
alembic revision --autogenerate -m "add rating to product"
```

3. **Review generated file** in `alembic/versions/`:
```
abc123def.py  # Review the up() and down() functions
```

4. **Apply migration**:
```bash
alembic upgrade head
# Or: python migration/manage.py migrate
```

5. **Test your app** to ensure everything works

## Common Issues

**Problem**: `alembic` command not found
- **Solution**: Activate the virtual environment first
```bash
.venv\Scripts\activate
```

**Problem**: Empty migration generated
- **Solution**: Make sure you're modifying actual model fields, not just comments

**Problem**: Circular import errors
- **Solution**: Check `alembic/env.py` imports, ensure models are imported correctly

**Problem**: Migration already applied
- **Solution**: Check `alembic_version` table to find current state
```bash
alembic current
```

## Best Practices

1. ✅ Always review auto-generated migrations before applying
2. ✅ Use descriptive migration messages
3. ✅ Test migrations on development database first
4. ✅ Keep migrations small and focused on one change
5. ✅ Never modify applied migrations (create new one instead)
6. ✅ Use `alembic upgrade head --sql` to validate before applying
7. ✅ Commit migration files to git with your model changes
