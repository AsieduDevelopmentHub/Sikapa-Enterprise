import { GA_MEASUREMENT_ID, isAnalyticsConfigured } from "@/lib/analytics/gtag";

/**
 * GA4 tag in <head> (Google install + Consent Mode v2 default denied for EEA).
 * Uses native <script> tags (not next/script beforeInteractive) so ESLint/Next are happy.
 */
export function GoogleAnalyticsHead() {
  if (!isAnalyticsConfigured()) return null;

  const id = GA_MEASUREMENT_ID;

  const consentDefault = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
`;

  const gtagConfig = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}', {
  send_page_view: false,
  anonymize_ip: true
});
`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: consentDefault }} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- GA install requires sync loader in head */}
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <script dangerouslySetInnerHTML={{ __html: gtagConfig }} />
    </>
  );
}
