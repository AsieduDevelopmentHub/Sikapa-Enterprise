"""
Prefix trie for autocomplete and fast prefix lookups.

Each terminal node stores a set of payload values (e.g. product ids).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, Hashable, Iterator, TypeVar

T = TypeVar("T", bound=Hashable)


@dataclass
class TrieNode(Generic[T]):
    children: dict[str, TrieNode[T]] = field(default_factory=dict)
    values: set[T] = field(default_factory=set)
    is_terminal: bool = False


class Trie(Generic[T]):
    """Case-sensitive character trie. Normalize keys before insert/search."""

    def __init__(self) -> None:
        self._root: TrieNode[T] = TrieNode()
        self._size = 0

    def __len__(self) -> int:
        return self._size

    def insert(self, key: str, value: T) -> None:
        if not key:
            return
        node = self._root
        for ch in key:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        if not node.is_terminal:
            self._size += 1
            node.is_terminal = True
        node.values.add(value)

    def _find(self, prefix: str) -> TrieNode[T] | None:
        node = self._root
        for ch in prefix:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def search_prefix(self, prefix: str, *, limit: int = 10) -> list[T]:
        """Return up to `limit` distinct values whose keys share `prefix`."""
        if not prefix or limit < 1:
            return []
        start = self._find(prefix)
        if start is None:
            return []
        seen: set[T] = set()
        out: list[T] = []

        def walk(node: TrieNode[T]) -> None:
            if len(out) >= limit:
                return
            if node.is_terminal:
                for v in node.values:
                    if v not in seen:
                        seen.add(v)
                        out.append(v)
                        if len(out) >= limit:
                            return
            for child in node.children.values():
                walk(child)
                if len(out) >= limit:
                    return

        walk(start)
        return out

    def keys_with_prefix(self, prefix: str, *, limit: int = 10) -> list[str]:
        """Collect terminal key strings under `prefix` (depth-first)."""
        start = self._find(prefix)
        if start is None:
            return []
        keys: list[str] = []

        def walk(node: TrieNode[T], path: list[str]) -> None:
            if len(keys) >= limit:
                return
            if node.is_terminal:
                keys.append("".join(path))
            for ch, child in sorted(node.children.items()):
                path.append(ch)
                walk(child, path)
                path.pop()
                if len(keys) >= limit:
                    return

        walk(start, list(prefix))
        return keys
