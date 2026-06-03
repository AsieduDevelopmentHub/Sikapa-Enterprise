"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { CookiePreferences } from "@/lib/analytics/cookie-preferences";
import { analyticsConsentGranted } from "@/lib/analytics/cookie-preferences";
import { syncGtagConsentFromPreferences, trackPageView, updateGtagConsent } from "@/lib/analytics/gtag";

/**
 * Consent-gated GA4: tag loads in <head> (GoogleAnalyticsHead); hits fire after accept.
 */
export function StorefrontAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  const sendPageViewIfAllowed = () => {
    if (!analyticsConsentGranted()) return;
    syncGtagConsentFromPreferences();
    const path = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
    if (path === lastPath.current) return;
    trackPageView(path);
    lastPath.current = path;
  };

  useEffect(() => {
    const onConsent = (ev: Event) => {
      const detail = (ev as CustomEvent<CookiePreferences>).detail;
      updateGtagConsent(Boolean(detail?.analytics));
      if (detail?.analytics) {
        const path = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
        trackPageView(path);
        lastPath.current = path;
      }
    };
    window.addEventListener("sikapa:cookie-consent", onConsent);
    sendPageViewIfAllowed();
    return () => window.removeEventListener("sikapa:cookie-consent", onConsent);
  }, [pathname, searchParams]);

  useEffect(() => {
    sendPageViewIfAllowed();
  }, [pathname, searchParams]);

  return null;
}
