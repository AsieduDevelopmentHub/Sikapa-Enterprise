"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { SikapaLogo } from "@/components/SikapaLogo";

const STORAGE_KEY = "sikapa_splash_seen";
/** Time logo stays readable after entrance bounce (ms). */
const HOLD_MS = 2600;
/** Must match `splash-dissolve-out` duration in tailwind.config.js */
const EXIT_ANIM_MS = 780;

/**
 * Animated brand gradient, elastic logo entrance, blur/scale dissolve on exit.
 */
export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [exiting, setExiting] = useState(false);

  useLayoutEffect(() => {
    let displayTimer: number | undefined;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setShow(false);
        return;
      }
    } catch {
      /* still show splash */
    }

    displayTimer = window.setTimeout(() => {
      setExiting(true);
    }, HOLD_MS);

    return () => {
      if (displayTimer !== undefined) {
        window.clearTimeout(displayTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (!exiting) return;

    const exitTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setShow(false);
    }, EXIT_ANIM_MS);

    return () => window.clearTimeout(exitTimer);
  }, [exiting]);

  if (!show) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center ${exiting ? "animate-splash-dissolve-out" : ""}`}
      aria-hidden
    >
      <div className="sikapa-splash-gradient-bg" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30"
        aria-hidden
      />

      <div className="relative z-[1] flex items-center justify-center px-8">
        <div className="animate-splash-logo-bounce">
          <div className="animate-splash-logo-glow">
            <SikapaLogo
              asset="primary"
              alt=""
              priority
              imageClassName="h-auto max-h-[min(340px,52vh)] w-[min(260px,78vw)] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
