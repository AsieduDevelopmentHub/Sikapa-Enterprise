"use client";

import { useCallback, useEffect, useRef } from "react";
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

  const pagePath = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;

  const sendPageViewIfAllowed = useCallback(() => {
    if (!analyticsConsentGranted()) return;
    syncGtagConsentFromPreferences();
    if (pagePath === lastPath.current) return;
    trackPageView(pagePath);
    lastPath.current = pagePath;
  }, [pagePath]);

  useEffect(() => {
    const onConsent = (ev: Event) => {
      const detail = (ev as CustomEvent<CookiePreferences>).detail;
      updateGtagConsent(Boolean(detail?.analytics));
      if (detail?.analytics) {
        trackPageView(pagePath);
        lastPath.current = pagePath;
      }
    };
    window.addEventListener("sikapa:cookie-consent", onConsent);
    sendPageViewIfAllowed();
    return () => window.removeEventListener("sikapa:cookie-consent", onConsent);
  }, [pagePath, sendPageViewIfAllowed]);

  return null;
}
