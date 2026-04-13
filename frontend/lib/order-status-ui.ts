/** Order row `status` from API (see `Order` model). */
export function orderStatusLabel(status: string): string {
  const s = status.trim().toLowerCase();
  if (!s) return "Unknown";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function orderStatusPillClass(status: string): string {
  const s = status.trim().toLowerCase();
  switch (s) {
    case "delivered":
      return "bg-emerald-700 text-white ring-emerald-800";
    case "shipped":
      return "bg-amber-100 text-amber-950 ring-amber-300/80";
    case "processing":
      return "bg-sikapa-crimson text-white ring-sikapa-crimson";
    case "cancelled":
      return "bg-zinc-600 text-white ring-zinc-700";
    case "pending":
    default:
      return "bg-sikapa-gray-soft text-sikapa-text-secondary ring-black/[0.08] dark:bg-zinc-800 dark:text-zinc-200 dark:ring-white/10";
  }
}
