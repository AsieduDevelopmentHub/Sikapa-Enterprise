"use client";

import { RefreshCw } from "lucide-react";

export function AdminRefreshButton({
  onClick,
  loading = false,
  label = "Refresh",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-sikapa-text-secondary ring-1 ring-black/[0.08] transition hover:bg-sikapa-cream disabled:opacity-60"
      aria-label={label}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
      {loading ? "Refreshing…" : label}
    </button>
  );
}
