#!/usr/bin/env python3
"""
DESTRUCTIVE: Clear transactional / customer data from PostgreSQL (Supabase) while keeping
the product catalog (products, categories, images, variants) and any existing admin users.

Also empties Supabase Storage except catalog object prefixes (products/, categories/, variants/).

Schema, RLS policies, and SQL functions are preserved.

Requires:
  - DATABASE_URL=postgresql://...
  - SUPABASE_WIPE_CONFIRM=DELETE_ALL_DATA (or pass --i-am-sure)
  - SUPABASE_URL + SUPABASE_SERVICE_KEY to prune storage (optional; skip if unset)

Usage:
  cd backend
  set SUPABASE_WIPE_CONFIRM=DELETE_ALL_DATA
  python tools/supabase_wipe_data.py
  python tools/supabase_wipe_data.py --i-am-sure --skip-storage
  python tools/supabase_wipe_data.py --i-am-sure --purge-catalog   # legacy full wipe
"""

from __future__ import annotations

import argparse
import os
import sys

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
WIPE_ENV = "SUPABASE_WIPE_CONFIRM"
EXPECTED_CONFIRM = "DELETE_ALL_DATA"

# Catalog tables kept by default (partial wipe).
_CATALOG_TABLES = ("product", "category", "productimage", "productvariant")

# Transactional / customer tables cleared on partial wipe (order = TRUNCATE CASCADE).
_PARTIAL_TRUNCATE_TABLES = (
    "reviewmedia",
    "review",
    "cartitem",
    "wishlistitem",
    "orderitem",
    "invoice",
    "paystack_transaction",
    "paystack_init_idempotency",
    "orderreturnitem",
    "orderreturn",
    "couponusage",
    "coupon",
    "inventoryadjustment",
    "searchquerylog",
    "emailsubscription",
    '"order"',
    "auditlog",
    "businesssetting",
    "tokenblacklist",
    "otpcode",
    "twofactorsecret",
    "passwordreset",
)

# Legacy full wipe — includes catalog + all users.
_FULL_TRUNCATE_TABLES = _PARTIAL_TRUNCATE_TABLES + _CATALOG_TABLES + ('"user"',)

# Top-level storage folder names to keep when pruning buckets (partial wipe).
_PRESERVED_STORAGE_ROOTS = frozenset({"products", "categories", "variants"})


def _truncate_sql(tables: tuple[str, ...]) -> str:
    joined = ",\n  ".join(tables)
    return f"TRUNCATE TABLE\n  {joined}\nRESTART IDENTITY CASCADE;"


_PARTIAL_TRUNCATE_SQL = _truncate_sql(_PARTIAL_TRUNCATE_TABLES)
_FULL_TRUNCATE_SQL = _truncate_sql(_FULL_TRUNCATE_TABLES)

_RESET_PRODUCT_STATS_SQL = """
UPDATE product
SET sales_count = 0, avg_rating = 0.0
WHERE sales_count <> 0 OR avg_rating <> 0.0;
"""


def _require_confirm(cli_sure: bool) -> None:
    if cli_sure:
        return
    if os.getenv(WIPE_ENV, "").strip() == EXPECTED_CONFIRM:
        return
    print(
        f"Refusing to wipe: set {WIPE_ENV}={EXPECTED_CONFIRM} "
        f"or pass --i-am-sure",
        file=sys.stderr,
    )
    sys.exit(1)


def _truncate_postgres(*, purge_catalog: bool) -> None:
    if not DATABASE_URL.startswith("postgresql"):
        print("DATABASE_URL is not PostgreSQL; nothing to truncate.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(DATABASE_URL, echo=False)
    with engine.begin() as conn:
        if purge_catalog:
            conn.execute(text(_FULL_TRUNCATE_SQL))
            print(
                "PostgreSQL: full wipe — all application tables truncated "
                "(including product, category, and all users)."
            )
        else:
            conn.execute(text(_PARTIAL_TRUNCATE_SQL))
            deleted = conn.execute(
                text('DELETE FROM "user" WHERE is_admin IS NOT TRUE')
            ).rowcount
            conn.execute(text(_RESET_PRODUCT_STATS_SQL))
            admins = conn.execute(
                text('SELECT COUNT(*) FROM "user" WHERE is_admin IS TRUE')
            ).scalar_one()
            print(
                "PostgreSQL: transactional data truncated; catalog preserved "
                f"({', '.join(_CATALOG_TABLES)})."
            )
            print(f"PostgreSQL: removed {deleted} non-admin user(s); kept {admins} admin account(s).")
            if admins == 0:
                print(
                    "Warning: no admin users remain — create one with "
                    "python tools/admin/createadminaccount.py",
                    file=sys.stderr,
                )


def _storage_prefix_preserved(prefix: str) -> bool:
    """Return True if this bucket path (folder or object) belongs to the catalog."""
    if not prefix:
        return False
    top = prefix.split("/")[0]
    return top in _PRESERVED_STORAGE_ROOTS


def _empty_storage_buckets(*, purge_catalog: bool) -> None:
    from app.core.supabase import (  # noqa: WPS433 — runtime import after env
        SUPABASE_STORAGE_BUCKET,
        get_supabase_client,
    )

    client = get_supabase_client()
    if not client:
        print("Supabase client not configured; skipping storage wipe.")
        return

    buckets = [SUPABASE_STORAGE_BUCKET]
    extra = os.getenv("SUPABASE_STORAGE_BUCKET_NAMES", "").strip()
    if extra:
        buckets.extend(x.strip() for x in extra.split(",") if x.strip())
    buckets = list(dict.fromkeys(buckets))

    def delete_prefix(bucket: str, prefix: str) -> None:
        if not purge_catalog and _storage_prefix_preserved(prefix):
            return

        items = client.storage.from_(bucket).list(prefix)
        if not items:
            return
        paths: list[str] = []
        for it in items:
            name = it.get("name")
            if not name:
                continue
            full = f"{prefix}/{name}" if prefix else name
            if it.get("id") is None and not it.get("metadata"):
                delete_prefix(bucket, full)
            else:
                paths.append(full)
        if paths:
            client.storage.from_(bucket).remove(paths)

    for b in buckets:
        try:
            if purge_catalog:
                delete_prefix(b, "")
                print(f"Storage: emptied bucket {b!r} (full wipe).")
            else:
                root_items = client.storage.from_(b).list("")
                if not root_items:
                    print(f"Storage: bucket {b!r} is empty or unreachable.")
                    continue
                for it in root_items:
                    name = it.get("name")
                    if not name:
                        continue
                    if name in _PRESERVED_STORAGE_ROOTS:
                        continue
                    delete_prefix(b, name)
                kept = ", ".join(sorted(_PRESERVED_STORAGE_ROOTS))
                print(f"Storage: pruned bucket {b!r} (kept {kept}/).")
        except Exception as exc:
            print(f"Storage: failed to prune {b!r}: {exc}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Wipe Sikapa transactional data from Postgres + Supabase Storage. "
            "By default keeps product/category catalog and admin users."
        )
    )
    parser.add_argument(
        "--i-am-sure",
        action="store_true",
        help=f"Skip {WIPE_ENV} check (still requires PostgreSQL DATABASE_URL).",
    )
    parser.add_argument(
        "--skip-storage",
        action="store_true",
        help="Only touch Postgres; do not prune Supabase Storage.",
    )
    parser.add_argument(
        "--purge-catalog",
        action="store_true",
        help=(
            "Legacy full wipe: truncate product, category, productimage, productvariant, "
            "and all users; empty entire storage bucket(s)."
        ),
    )
    args = parser.parse_args()

    _require_confirm(args.i_am_sure)
    _truncate_postgres(purge_catalog=args.purge_catalog)
    if not args.skip_storage:
        _empty_storage_buckets(purge_catalog=args.purge_catalog)


if __name__ == "__main__":
    main()
