import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";
import { pageMetadata } from "@/lib/seo";
import { SIKAPA_LOCATION_LINE, SIKAPA_STORE_MAP_HREF, SIKAPA_SUPPORT_EMAIL } from "@/lib/site";

export const metadata = pageMetadata("Terms of Service", {
  description:
    "Terms and conditions for using Sikapa Enterprise — orders, payments, shipping, returns, and acceptable use.",
  path: "/terms",
});

const UPDATED = "May 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Terms of Service" left="back" backHref="/" right="none" />
      <article className="mx-auto max-w-mobile px-5 py-8 pb-16 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-400">
        <header className="mb-8 border-b border-sikapa-gray-soft pb-6 dark:border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted dark:text-zinc-500">
            Sikapa Enterprise
          </p>
          <h1 className="mt-2 font-serif text-[1.35rem] font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Terms of Service
          </h1>
          <p className="mt-2 text-sikapa-text-muted dark:text-zinc-500">Last updated: {UPDATED}</p>
          <p className="mt-4 text-body text-sikapa-text-primary dark:text-zinc-300">
            These terms apply when you shop on Sikapa’s website, use the Sikapa mobile app, or otherwise interact with
            Sikapa Enterprise. By placing an order or creating an account, you agree to these terms. If you do not agree,
            do not use our services.
          </p>
        </header>

        <div className="space-y-10">
          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              1. About Sikapa
            </h2>
            <p className="mt-3">
              Sikapa Enterprise (“Sikapa,” “we,” “us”) sells beauty, cosmetics, and personal-care products online and
              supports in-person pickup at {SIKAPA_LOCATION_LINE}. Directions and hours are on our{" "}
              <Link href={SIKAPA_STORE_MAP_HREF} className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                store map
              </Link>
              . For help with these terms, email{" "}
              <a
                href={`mailto:${SIKAPA_SUPPORT_EMAIL}`}
                className="font-semibold text-sikapa-gold underline-offset-2 hover:underline"
              >
                {SIKAPA_SUPPORT_EMAIL}
              </a>{" "}
              or visit{" "}
              <Link href="/help/contact" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                Help → Contact
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              2. Your account
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>You must be at least 18 years old and able to enter a binding contract under Ghanaian law.</li>
              <li>
                Keep your password and 2FA codes private. Activity under your account is your responsibility until you
                tell us it has been compromised.
              </li>
              <li>
                Provide accurate name, contact, and delivery details. We may suspend accounts used for fraud, abuse, or
                repeated policy violations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              3. Products and pricing
            </h2>
            <p className="mt-3">
              Product photos and descriptions reflect the items we intend to supply. Colours may vary slightly by screen
              or batch. Prices on Sikapa are shown in Ghana cedis (GHS) unless stated otherwise. Delivery fees and
              shipping regions are calculated at checkout based on your selected region and city within Ghana. If an item
              becomes unavailable after you order, we will contact you to cancel that line, substitute with your
              approval, or refund the affected amount.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              4. Orders and payment
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                Submitting checkout is an offer to buy. Sikapa accepts when we confirm the order and/or successfully
                process payment.
              </li>
              <li>
                Payment is handled by Paystack (card, bank, or other methods Paystack supports in Ghana). You authorise
                Sikapa and Paystack to charge the total shown at checkout, including applicable delivery fees.
              </li>
              <li>
                Unpaid orders may be cancelled after a reasonable period. Paid orders are subject to our fulfilment and
                anti-fraud checks.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              5. Delivery and pickup
            </h2>
            <p className="mt-3">
              You may choose nationwide delivery or local pickup at New Edubiase. Estimated timelines and fees are shown
              at checkout. Risk passes to you when the courier records delivery or when you collect a ready pickup order
              from our store. If a parcel is delayed or missing, contact us promptly with your order number so we can
              trace it with the carrier. See{" "}
              <Link href="/help/shipping" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                Help → Shipping
              </Link>{" "}
              for current guidance.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              6. Returns and refunds
            </h2>
            <p className="mt-3">
              Returns follow Sikapa’s published return policy. For hygiene reasons, opened cosmetics, used applicators,
              and sealed personal-care items may not be returnable unless faulty or not as described. Eligible returns
              are processed to the original Paystack payment path where possible. Start a return from your order page or
              see{" "}
              <Link href="/help/returns" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                Help → Returns
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              7. Acceptable use
            </h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>Use Sikapa for unlawful purposes or to harm other customers or staff;</li>
              <li>Attempt unauthorised access to accounts, admin tools, or our infrastructure;</li>
              <li>Scrape, overload, or reverse-engineer the site or app beyond normal shopping use;</li>
              <li>Submit false payment, identity, or delivery information.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              8. Intellectual property
            </h2>
            <p className="mt-3">
              Sikapa branding, product photography, site design, and written content are owned by Sikapa Enterprise or
              our licensors. You may browse and purchase for personal use. Commercial copying, resale of our media, or
              misuse of the Sikapa name without written permission is not allowed.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              9. Service availability
            </h2>
            <p className="mt-3">
              We aim to keep the storefront and app available, but maintenance, network issues, or third-party outages
              (including Paystack or carriers) may cause interruptions. We are not responsible for delays outside our
              reasonable control once an order has been handed to a carrier.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              10. Limitation of liability
            </h2>
            <p className="mt-3">
              To the extent permitted by Ghanaian law, Sikapa is not liable for indirect or consequential loss, lost
              profits, or loss of data arising from use of our services. Our total liability for a claim relating to a
              specific order is limited to the amount you paid Sikapa for that order. Nothing in these terms limits
              rights you have under mandatory consumer protection law in Ghana.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              11. Changes to these terms
            </h2>
            <p className="mt-3">
              We may update these terms when Sikapa’s services or legal requirements change. The “Last updated” date will
              reflect the revision. Continued use after an update means you accept the new terms. If you disagree, stop
              using Sikapa and close your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              12. Governing law
            </h2>
            <p className="mt-3">
              These terms are governed by the laws of the Republic of Ghana. Disputes will be handled by the courts of
              Ghana, subject to any non-waivable consumer rights where you live.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              13. Privacy
            </h2>
            <p className="mt-3">
              Our{" "}
              <Link href="/privacy" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
                Privacy Policy
              </Link>{" "}
              explains how Sikapa collects and uses personal data, including Paystack payment metadata, delivery
              addresses, and account information.
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
