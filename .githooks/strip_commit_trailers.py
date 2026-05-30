"""Strip Co-authored-by and other attribution trailers from git commit messages."""
from __future__ import annotations

import pathlib
import re
import sys

# Any Co-authored-by line (Cursor, Copilot, humans, etc.)
_CO_AUTHOR = re.compile(r"(?i)^\s*co-authored-by\s*:\s*.+\s*$")

# Git trailer keys commonly injected by IDEs/agents (not project refs like Fixes:)
_ATTRIBUTION_KEYS = (
    "co-authored-by",
    "made-with",
    "made-by",
    "assisted-by",
    "generated-by",
    "created-with",
    "created-by",
    "reviewed-by",
    "helped-by",
    "thanks-to",
    "credit",
    "on-behalf-of",
    "based-on-patch-by",
    "reported-by",
    "tested-by",
    "ack",
    "signed-off-by",
)
_ATTRIBUTION_TRAILER = re.compile(
    r"(?i)^\s*(?:" + "|".join(re.escape(k) for k in _ATTRIBUTION_KEYS) + r")\s*:\s*.+\s*$"
)

# Project/issue trailers to keep when stripping unknown footer trailers
_KEEP_TRAILER_KEYS = frozenset(
    {
        "fixes",
        "closes",
        "refs",
        "ref",
        "see-also",
        "related",
        "issue",
        "bug",
        "cherry-pick",
        "change-id",
    }
)
_GENERIC_TRAILER = re.compile(r"^([A-Za-z][A-Za-z0-9-]*(?:\([^)]+\))?):(?:\s*.+)?$")

# Agent/IDE emails and product names in any trailer value
_AGENT_VALUE = re.compile(
    r"(?i)cursoragent@cursor\.com|copilot@github\.com|\bcursor\b|\bcopilot\b"
)


def _trailer_key(core: str) -> str | None:
    m = _GENERIC_TRAILER.match(core)
    return m.group(1).lower() if m else None


def _should_strip(core: str) -> bool:
    if _CO_AUTHOR.match(core) or _ATTRIBUTION_TRAILER.match(core):
        return True
    if ":" in core and _AGENT_VALUE.search(core):
        return True
    key = _trailer_key(core)
    if key is not None and key not in _KEEP_TRAILER_KEYS:
        return True
    return False


def strip_agent_attribution_only(text: str) -> str:
    """Remove Co-authored-by / agent trailers only (safe for history rewrite).

    Unlike strip_message(), does not strip generic ``type: subject`` commit
    subject lines or other non-attribution ``Key: value`` lines in the body.
    """
    lines = text.splitlines(True)
    if not lines:
        return text
    out: list[str] = []
    for line in lines:
        core = line.replace("\r", "").rstrip("\n")
        if core == "":
            out.append(line)
            continue
        if _CO_AUTHOR.match(core) or _ATTRIBUTION_TRAILER.match(core):
            continue
        if ":" in core and _AGENT_VALUE.search(core):
            continue
        if re.match(r"(?i)^\s*--trailer\b", core):
            continue
        out.append(line)
    result = "".join(out)
    while result.endswith("\n\n") or result.endswith("\r\n\r\n"):
        result = result[:-1]
    return result.rstrip() + ("\n" if text.endswith("\n") else "")


def strip_message(text: str) -> str:
    lines = text.splitlines(True)
    if not lines:
        return text

    out: list[str] = []
    for line in lines:
        core = line.replace("\r", "").rstrip("\n")
        if core == "":
            out.append(line)
            continue
        if _should_strip(core):
            continue
        out.append(line)

    result = "".join(out)
    # Trim trailing whitespace-only lines left after removals
    while result.endswith("\n\n") or result.endswith("\r\n\r\n"):
        result = result[:-1]
    return result.rstrip() + ("\n" if text.endswith("\n") else "")


def main() -> None:
    path = pathlib.Path(sys.argv[1])
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        raise SystemExit(0)
    stripped = strip_message(raw)
    if stripped != raw:
        path.write_text(stripped, encoding="utf-8", newline="")


if __name__ == "__main__":
    main()
