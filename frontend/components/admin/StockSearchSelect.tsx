"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryStockLevelRow } from "@/lib/api/admin";

export function stockOptionValue(row: InventoryStockLevelRow): string {
  if (row.kind === "variant" && row.variant_id != null) {
    return `v-${row.product_id}-${row.variant_id}`;
  }
  return `p-${row.product_id}`;
}

function optionLabel(row: InventoryStockLevelRow): string {
  const kind = row.kind === "variant" ? " · variant" : " · base product";
  return `${row.label}${kind}`;
}

type Props = {
  rows: InventoryStockLevelRow[];
  value: string;
  onChange: (stockKey: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function StockSearchSelect({
  rows,
  value,
  onChange,
  disabled = false,
  placeholder = "Search product or variant…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => rows.find((r) => stockOptionValue(r) === value) ?? null,
    [rows, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...rows].sort((a, b) => a.label.localeCompare(b.label));
    if (!q) return sorted;
    return sorted.filter((r) => {
      const hay = `${r.label} ${r.sku ?? ""} ${r.kind}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const displayValue = open ? query : selected ? optionLabel(selected) : query;

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        type="search"
        disabled={disabled}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange("");
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          if (selected) {
            setQuery("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
            inputRef.current?.blur();
          }
        }}
        className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-small outline-none ring-sikapa-gold focus:ring-2 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="stock-search-listbox"
      />
      {open && (
        <ul
          id="stock-search-listbox"
          role="listbox"
          className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-black/[0.08] bg-white py-1 shadow-lg ring-1 ring-black/[0.06] dark:border-white/15 dark:bg-zinc-900"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-small text-sikapa-text-muted dark:text-zinc-400">
              No matches.
            </li>
          ) : (
            filtered.map((r) => {
              const key = stockOptionValue(r);
              const active = key === value;
              return (
                <li key={key} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(key);
                      setQuery("");
                      setOpen(false);
                      inputRef.current?.blur();
                    }}
                    className={`block w-full px-3 py-2 text-left text-small hover:bg-sikapa-cream dark:hover:bg-zinc-800 ${
                      active
                        ? "bg-sikapa-gold/10 font-semibold text-sikapa-gold dark:text-sikapa-gold"
                        : "text-sikapa-text-primary dark:text-zinc-100"
                    }`}
                  >
                    {optionLabel(r)}
                    {r.sku ? (
                      <span className="mt-0.5 block font-mono text-[10px] text-sikapa-text-muted dark:text-zinc-400">
                        SKU: {r.sku}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
