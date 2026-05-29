import { useCallback, useEffect, useRef } from "react";

type AdminLiveLoadOptions = {
  /** Poll while the tab is visible. 0 disables polling. */
  intervalMs?: number;
  enabled?: boolean;
};

const DEFAULT_ADMIN_POLL_MS = 10_000;

/**
 * Runs `load` on mount/deps change, when the tab regains focus, and on an interval.
 * Pass `{ silent: true }` from the loader to avoid full-page skeleton flicker on polls.
 */
export function useAdminLiveLoad(
  load: (opts?: { silent?: boolean }) => void | Promise<void>,
  deps: readonly unknown[],
  options: AdminLiveLoadOptions = {}
): { reload: (opts?: { silent?: boolean }) => void; refreshing: () => void } {
  const { intervalMs = DEFAULT_ADMIN_POLL_MS, enabled = true } = options;
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback((opts?: { silent?: boolean }) => {
    void loadRef.current(opts);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void loadRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns `deps`
  }, [enabled, ...deps]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadRef.current({ silent: true });
      }
    }, intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);

  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadRef.current({ silent: true });
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { reload: run, refreshing: () => run({ silent: true }) };
}
