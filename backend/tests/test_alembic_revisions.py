"""Smoke-test Alembic revision modules load and expose upgrade/downgrade."""

from __future__ import annotations

import importlib.util
from pathlib import Path


def _load_revision_module(stem: str):
    path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / f"{stem}.py"
    spec = importlib.util.spec_from_file_location(f"sikapa_revision_{stem}", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_all_alembic_revisions_import():
    versions_dir = Path(__file__).resolve().parents[1] / "alembic" / "versions"
    stems = sorted(p.stem for p in versions_dir.glob("*.py") if not p.name.startswith("__"))
    assert stems, "expected alembic versions"

    for stem in stems:
        mod = _load_revision_module(stem)
        assert callable(getattr(mod, "upgrade", None)), f"{stem} missing upgrade()"
        assert callable(getattr(mod, "downgrade", None)), f"{stem} missing downgrade()"
        assert getattr(mod, "revision", None), f"{stem} missing revision id"
