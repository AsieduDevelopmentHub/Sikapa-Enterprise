"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { CookiePreferences } from "@/lib/analytics/cookie-preferences";
import { analyticsConsentGranted } from "@/lib/analytics/cookie-preferences";
import { initGtag, trackPageView } from "@/lib/analytics/gtag";

/**
 * Consent-gated GA4: loads only after analytics cookies are accepted.
 * Sends manual page_view events (send_page_view: false in config).
 */
export function StorefrontAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const onConsent = (ev: Event) => {
      const detail = (ev as CustomEvent<CookiePreferences>).detail;
      if (detail?.analytics) {
        initGtag();
        const path = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
        trackPageView(path);
        lastPath.current = path;
      }
    };
    window.addEventListener("sikapa:cookie-consent", onConsent);
    if (analyticsConsentGranted()) {
      initGtag();
      const path = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
      trackPageView(path);
      lastPath.current = path;
    }
    return () => window.removeEventListener("sikapa:cookie-consent", onConsent);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!analyticsConsentGranted()) return;
    const path = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
    if (path === lastPath.current) return;
    trackPageView(path);
    lastPath.current = path;
  }, [pathname, searchParams]);

  return null;
}
