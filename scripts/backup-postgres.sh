#!/usr/bin/env bash
# Manual PostgreSQL logical backup. Schedule via cron on a secure runner with DATABASE_URL set.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Example:" >&2
  echo '  export DATABASE_URL="postgresql://user:pass@host:5432/dbname"' >&2
  exit 1
fi

command -v pg_dump >/dev/null || {
  echo "pg_dump not found; install PostgreSQL client tools." >&2
  exit 1
}

OUT_DIR="${BACKUP_OUT_DIR:-./db-backups}"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/sikapa-${STAMP}.dump"

echo "Writing $FILE ..."
pg_dump "$DATABASE_URL" --format=custom --file="$FILE"

echo "Done (${FILE}). Store off-server (S3, encrypted disk, etc.)."
