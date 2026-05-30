#!/bin/sh
set -eu

echo "[entrypoint] Running Alembic migrations..."
alembic upgrade head

echo "[entrypoint] Applying PostgreSQL RLS policies (no-op on non-Postgres URLs)..."
python tools/rls/rls_setup.py

echo "[entrypoint] Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
