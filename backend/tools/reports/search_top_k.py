#!/usr/bin/env python3
"""
Print top-K search queries from SearchQueryLog using a min-heap (O(n log k)).

Usage:
  cd backend
  python tools/reports/search_top_k.py --days 30 --limit 20
"""
from __future__ import annotations

import argparse
import os
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env", override=False)

from sqlmodel import Session, select

from app.core.dsa.top_k import top_k_by_count
from app.db import engine
from app.models import SearchQueryLog


def main() -> int:
    parser = argparse.ArgumentParser(description="Top-K product search queries")
    parser.add_argument("--days", type=int, default=30, help="Lookback window")
    parser.add_argument("--limit", type=int, default=20, help="Top K results")
    args = parser.parse_args()

    since = datetime.utcnow() - timedelta(days=max(args.days, 1))
    with Session(engine) as session:
        rows = session.exec(
            select(SearchQueryLog.normalized_query).where(
                SearchQueryLog.created_at >= since
            )
        ).all()

    counts = Counter(q for q in rows if q)
    ranked = top_k_by_count(dict(counts), args.limit)

    print(f"Top {args.limit} searches (last {args.days} days)\n")
    for i, (query, count) in enumerate(ranked, start=1):
        print(f"{i:2}. {query!r}  ({count})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
