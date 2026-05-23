"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MAINTENANCE_EVENT, type MaintenanceDetail } from "@/lib/api/error-message";

const MAINTENANCE_PATH = "/maintenance";

/**
 * Listens for `sikapa-maintenance` events dispatched by the API client when
 * the backend returns a 503 maintenance response, and navigates the user to
 * the static maintenance page so they see a friendly screen instead of
 * scattered "Something went wrong" toasts.
 */
export function MaintenanceWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onMaintenance() {
      if (pathname === MAINTENANCE_PATH) return;
      router.replace(MAINTENANCE_PATH);
    }
    window.addEventListener(MAINTENANCE_EVENT, onMaintenance as EventListener);
    return () => {
      window.removeEventListener(MAINTENANCE_EVENT, onMaintenance as EventListener);
    };
  }, [router, pathname]);

  return null;
}

export type { MaintenanceDetail };
