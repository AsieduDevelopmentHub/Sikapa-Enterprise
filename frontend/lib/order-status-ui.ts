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
      return "bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30";
    case "shipped":
      return "bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-500/30";
    case "processing":
      return "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30";
    case "cancelled":
      return "bg-zinc-100 text-zinc-900 ring-zinc-200 dark:bg-zinc-500/20 dark:text-zinc-300 dark:ring-zinc-500/30";
    case "pending":
    default:
      return "bg-sikapa-gray-soft text-sikapa-text-secondary ring-black/[0.08] dark:bg-zinc-800 dark:text-zinc-200 dark:ring-white/10";
  }
}
