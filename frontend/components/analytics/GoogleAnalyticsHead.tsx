import Script from "next/script";
import { GA_MEASUREMENT_ID, isAnalyticsConfigured } from "@/lib/analytics/gtag";

/**
 * GA4 tag in <head> (Google install + Consent Mode v2 default denied for EEA).
 * Measurement hits stay gated until the user accepts analytics cookies.
 */
export function GoogleAnalyticsHead() {
  if (!isAnalyticsConfigured()) return null;

  const id = GA_MEASUREMENT_ID;

  return (
    <>
      <Script id="gtag-consent-default" strategy="beforeInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
        `}
      </Script>
      <Script
        id="gtag-js"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      />
      <Script id="gtag-config" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}', {
  send_page_view: false,
  anonymize_ip: true
});
        `}
      </Script>
    </>
  );
}
