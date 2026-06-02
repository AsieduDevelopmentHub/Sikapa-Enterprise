import { analyticsConsentGranted } from "@/lib/analytics/cookie-preferences";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

let initialized = false;

export function isAnalyticsConfigured(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

export function canTrackAnalytics(): boolean {
  return isAnalyticsConfigured() && analyticsConsentGranted();
}

/** Load gtag.js once after the user accepts analytics cookies. */
export function initGtag(): void {
  if (typeof window === "undefined" || !canTrackAnalytics() || initialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });

  initialized = true;
}

export function trackPageView(path: string, title?: string): void {
  if (!canTrackAnalytics() || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!canTrackAnalytics() || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}
