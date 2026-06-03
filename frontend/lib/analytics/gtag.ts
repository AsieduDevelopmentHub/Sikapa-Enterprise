import { analyticsConsentGranted } from "@/lib/analytics/cookie-preferences";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

export function isAnalyticsConfigured(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

export function canTrackAnalytics(): boolean {
  return isAnalyticsConfigured() && analyticsConsentGranted();
}

function gtagAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/** Consent Mode v2 — call after accept/decline or when restoring saved preference. */
export function updateGtagConsent(analyticsGranted: boolean): void {
  if (!isAnalyticsConfigured() || !gtagAvailable()) return;

  window.gtag!("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: analyticsGranted ? "granted" : "denied",
    ad_user_data: analyticsGranted ? "granted" : "denied",
    ad_personalization: analyticsGranted ? "granted" : "denied",
  });
}

/** Apply stored cookie preference to gtag (scripts load from GoogleAnalyticsHead). */
export function syncGtagConsentFromPreferences(): void {
  if (!isAnalyticsConfigured() || !gtagAvailable()) return;
  updateGtagConsent(analyticsConsentGranted());
}

export function trackPageView(path: string, title?: string): void {
  if (!canTrackAnalytics() || !gtagAvailable()) return;
  window.gtag!("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!canTrackAnalytics() || !gtagAvailable()) return;
  window.gtag!("event", name, params ?? {});
}
