import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";
import { pageMetadata } from "@/lib/seo";
import { SIKAPA_LOCATION_LINE, SIKAPA_STORE_MAP_HREF, SIKAPA_SUPPORT_EMAIL } from "@/lib/site";

export const metadata = pageMetadata("Privacy Policy", {
  description:
    "How Sikapa Enterprise collects, uses, and protects your personal information when you shop with us.",
  path: "/privacy",
});

const UPDATED = "May 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Privacy Policy" left="back" backHref="/" right="none" />
      <article className="mx-auto max-w-mobile px-5 py-8 pb-16 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-400">
        <header className="mb-8 border-b border-sikapa-gray-soft pb-6 dark:border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted dark:text-zinc-500">
            Sikapa Enterprise
          </p>
          <h1 className="mt-2 font-serif text-[1.35rem] font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sikapa-text-muted dark:text-zinc-500">Last updated: {UPDATED}</p>
          <p className="mt-4 text-body text-sikapa-text-primary dark:text-zinc-300">
            This policy describes how Sikapa Enterprise (“Sikapa,” “we,” “us”) handles personal data when you use our
            website, mobile app, and related services to shop beauty and personal-care products. Our store is based in{" "}
            {SIKAPA_LOCATION_LINE}. Questions about privacy:{" "}
            <a
              href={`mailto:${SIKAPA_SUPPORT_EMAIL}`}
              className="font-semibold text-sikapa-gold underline-offset-2 hover:underline"
            >
              {SIKAPA_SUPPORT_EMAIL}
            </a>
            .
          </p>
        </header>

        <div className="space-y-10">
          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              1. Data controller
            </h2>
            <p className="mt-3">
              Sikapa Enterprise is the data controller for personal information processed through sikapa.com, our
              storefront, account area, checkout, and Sikapa mobile app when connected to the same account. Contact us at{" "}
              <a
                href={`mailto:${SIKAPA_SUPPORT_EMAIL}`}
                className="font-semibold text-sikapa-gold underline-offset-2 hover:underline"
              >
                {SIKAPA_SUPPORT_EMAIL}
              </a>{" "}
              or via{" "}
              <Link href="/help/contact" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                Help → Contact
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              2. Information we collect
            </h2>
            <p className="mt-3 font-medium text-sikapa-text-primary dark:text-zinc-200">Information you provide</p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>
                <strong>Account:</strong> name, username, optional email, phone (if you add it), and password (stored
                hashed — we never store plain-text passwords).
              </li>
              <li>
                <strong>Orders:</strong> delivery address, region and city (Ghana shipping), pickup preference, contact
                name and phone for delivery, order notes, and payment status from Paystack (we do not store full card
                numbers on our servers).
              </li>
              <li>
                <strong>Support:</strong> messages you send by email, WhatsApp, or in-app help, including order
                references you include.
              </li>
              <li>
                <strong>Marketing:</strong> email address and preferences if you subscribe to the Sikapa newsletter or
                product alerts.
              </li>
              <li>
                <strong>Security:</strong> optional two-factor authentication (TOTP) setup data when you enable 2FA on
                your account.
              </li>
            </ul>
            <p className="mt-4 font-medium text-sikapa-text-primary dark:text-zinc-200">Information collected automatically</p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>
                <strong>Session &amp; auth:</strong> access and refresh tokens, sign-in timestamps, and “remember me”
                preference (local or session storage in your browser).
              </li>
              <li>
                <strong>Cart &amp; browsing:</strong> items in your bag, recently viewed products, and wishlist when you
                are signed in.
              </li>
              <li>
                <strong>Technical:</strong> browser or device type, IP address, and request logs used for security,
                rate limiting, and troubleshooting.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              3. How we use your information
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>Create and secure your Sikapa account, including Google sign-in where enabled.</li>
              <li>Process orders in GHS, collect payment through Paystack, and arrange delivery or pickup in Ghana.</li>
              <li>Send order confirmations, shipping updates, and account security notices.</li>
              <li>Operate customer support and handle returns or refunds under our published policies.</li>
              <li>Send marketing emails only when you opt in; every marketing message includes an unsubscribe path.</li>
              <li>Prevent fraud, enforce our Terms of Service, and meet legal or tax record-keeping duties.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              4. Newsletter and product alerts
            </h2>
            <p className="mt-3">
              Sikapa may email you about new products, restocks, or price changes only if you subscribe through the
              footer form, your account settings, or another explicit opt-in. You can unsubscribe from any marketing
              email or from your account at any time. Order, payment, and security emails are not marketing and cannot
              be switched off while you have an active order or account that requires them.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              5. Legal basis (Ghana)
            </h2>
            <p className="mt-3">
              We process personal data under the Data Protection Act, 2012 (Act 843) and related guidance. Depending on
              the activity, we rely on: performing our contract with you (orders and accounts); your consent (marketing
              and optional cookies where applicable); legitimate interests balanced against your rights (security,
              service improvement, and fraud prevention); and legal obligations (tax, accounting, and lawful requests).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              6. Who we share data with
            </h2>
            <p className="mt-3">We do not sell personal data. We share it only to run Sikapa:</p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>
                <strong>Paystack</strong> — card and mobile-money payments, refunds, and payment webhooks.
              </li>
              <li>
                <strong>Delivery partners</strong> — name, phone, and address needed to deliver your order.
              </li>
              <li>
                <strong>Email provider (Resend)</strong> — transactional and marketing email delivery when you opt in.
              </li>
              <li>
                <strong>Hosting &amp; infrastructure</strong> — cloud providers that host our API, database, and media
                (under confidentiality and security terms).
              </li>
              <li>
                <strong>Authorities</strong> — when required by Ghanaian law or to protect Sikapa, customers, or the
                public.
              </li>
            </ul>
            <p className="mt-3">
              Some processors may store or route data outside Ghana. We choose providers with appropriate safeguards and
              limit sharing to what is necessary for each service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              7. How long we keep data
            </h2>
            <p className="mt-3">
              Order and invoice records are kept for the period required for tax and consumer-law purposes. Account data
              remains while your account is active and for a reasonable period after closure to resolve disputes.
              Marketing lists are updated when you unsubscribe. Security and audit logs are retained for a limited
              window unless a longer period is needed for an investigation.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              8. Security
            </h2>
            <p className="mt-3">
              Sikapa uses HTTPS for storefront and API traffic, hashed passwords, JWT-based sessions with refresh
              rotation, optional 2FA, and access controls on admin systems. No online system is perfectly secure — use a
              strong unique password and keep your devices updated.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              9. Your rights
            </h2>
            <p className="mt-3">
              Under Act 843 you may request access, correction, or deletion of personal data we hold about you, object
              to certain processing, or withdraw consent where processing is consent-based. Email{" "}
              <a
                href={`mailto:${SIKAPA_SUPPORT_EMAIL}`}
                className="font-semibold text-sikapa-gold underline-offset-2 hover:underline"
              >
                {SIKAPA_SUPPORT_EMAIL}
              </a>{" "}
              with enough detail for us to verify your identity. You may also lodge a complaint with the Data Protection
              Commission of Ghana if you believe we have handled your data unlawfully.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              10. Cookies and local storage
            </h2>
            <p className="mt-3">
              Sikapa uses cookies and browser storage for sign-in, cart, theme preference, session cookies for admin
              access, and optional analytics where enabled. Essential cookies are required for checkout and account
              features. Where we use non-essential cookies, we respect your choices through our cookie notice when shown.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              11. Children
            </h2>
            <p className="mt-3">
              Sikapa is intended for adults. We do not knowingly collect personal data from anyone under 18. If you
              believe a minor has created an account, contact us and we will delete the account where appropriate.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              12. Changes
            </h2>
            <p className="mt-3">
              We may update this policy as Sikapa’s services evolve. The “Last updated” date at the top will change, and
              material updates may be announced by email or a notice on the site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              13. Related documents
            </h2>
            <p className="mt-3">
              Use of Sikapa is also governed by our{" "}
              <Link href="/terms" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                Terms of Service
              </Link>
              . Store hours and directions:{" "}
              <Link href={SIKAPA_STORE_MAP_HREF} className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                Help → Contact (map)
              </Link>
              .
            </p>
          </section>
        </div>

        <p className="mt-12 border-t border-sikapa-gray-soft pt-8 dark:border-white/10">
          <Link href="/" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
            Back to home
          </Link>
        </p>
      </article>
    </main>
  );
}
