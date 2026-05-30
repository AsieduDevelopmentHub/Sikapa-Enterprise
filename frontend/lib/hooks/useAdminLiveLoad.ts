import { useLiveLoad } from "@/lib/hooks/useLiveLoad";

type AdminLiveLoadOptions = {
  /** Poll while the tab is visible. 0 disables polling. */
  intervalMs?: number;
  enabled?: boolean;
};

const DEFAULT_ADMIN_POLL_MS = 10_000;

/** Admin lists poll every 10s by default; refetch on tab focus. */
export function useAdminLiveLoad(
  load: (opts?: { silent?: boolean }) => void | Promise<void>,
  deps: readonly unknown[],
  options: AdminLiveLoadOptions = {}
): { reload: (opts?: { silent?: boolean }) => void; refreshing: () => void } {
  const { intervalMs = DEFAULT_ADMIN_POLL_MS, enabled = true } = options;
  return useLiveLoad(load, deps, { intervalMs, enabled });
}
