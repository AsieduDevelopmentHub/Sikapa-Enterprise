"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminCategory } from "@/lib/api/admin";

type Props = {
  categories: AdminCategory[];
  value: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

function resolveInitialId(
  raw: string | null | undefined,
  categories: AdminCategory[]
): number | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const id = Number(s);
    return categories.some((c) => c.id === id) ? id : null;
  }
  const lower = s.toLowerCase();
  const bySlug = categories.find((c) => c.slug?.toLowerCase() === lower);
  if (bySlug) return bySlug.id;
  const byName = categories.find((c) => c.name.toLowerCase() === lower);
  if (byName) return byName.id;
  return null;
}

export function resolveCategoryIdFromProductField(
  raw: string | null | undefined,
  categories: AdminCategory[]
): number | null {
  return resolveInitialId(raw, categories.filter((c) => c.is_active));
}

export function CategorySearchSelect({
  categories,
  value,
  onChange,
  disabled = false,
  placeholder = "Search categories…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => categories.filter((c) => c.is_active).sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const selected = active.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.slug.replace(/-/g, " ").includes(q)
    );
  }, [active, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-left text-body outline-none ring-sikapa-gold focus:ring-2 disabled:opacity-60"
      >
        <span className={selected ? "text-sikapa-text-primary" : "text-sikapa-text-muted"}>
          {selected ? selected.name : "Select category…"}
        </span>
        <span className="text-[10px] text-sikapa-text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-lg ring-1 ring-black/[0.06]">
          <div className="border-b border-black/[0.06] p-2">
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-black/[0.08] px-2.5 py-1.5 text-small outline-none focus:border-sikapa-gold"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full px-3 py-2 text-left text-small text-sikapa-text-muted hover:bg-sikapa-cream"
              >
                No category
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-small text-sikapa-text-muted">No matches.</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`block w-full px-3 py-2 text-left text-small hover:bg-sikapa-cream ${
                      c.id === value ? "bg-sikapa-gold/10 font-semibold text-sikapa-gold" : ""
                    }`}
                  >
                    {c.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
