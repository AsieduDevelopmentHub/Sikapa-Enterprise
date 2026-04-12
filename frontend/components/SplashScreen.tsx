"use client";

import { useLayoutEffect, useState } from "react";
import { SikapaLogo } from "@/components/SikapaLogo";

const STORAGE_KEY = "sikapa_splash_seen";
const DISPLAY_MS = 1500;

/**
 * Dismiss logic runs in a single `useLayoutEffect` so React Strict Mode’s
 * double-mount doesn’t leave the app stuck: first timer is cleared on the
 * strict unmount, the second subscription always schedules a fresh timeout.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    let timeoutId: number | undefined;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setVisible(false);
        return;
      }
    } catch {
      /* private mode / blocked storage — still show timed splash */
    }

    timeoutId = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setVisible(false);
    }, DISPLAY_MS);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-sikapa-cream"
      aria-hidden
    >
      <div className="animate-splash-in px-8">
        <SikapaLogo
          asset="primary"
          alt=""
          priority
          imageClassName="h-auto max-h-[min(340px,52vh)] w-[min(260px,78vw)] object-contain"
        />
      </div>
    </div>
  );
}
