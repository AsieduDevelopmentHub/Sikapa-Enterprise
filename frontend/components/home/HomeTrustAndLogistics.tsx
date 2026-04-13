"use client";

import Link from "next/link";
import { FaHeadset, FaLocationPin, FaShop, FaTrustAuthentic, FaTrustLock, FaTrustTruck } from "@/components/FaIcons";
import { SIKAPA_LOCATION_LINE, whatsappHelpUrl } from "@/lib/site";

const values = [
  {
    title: "Curated quality",
    body: "Products chosen for performance, safety, and inclusive beauty.",
    Icon: FaTrustAuthentic,
  },
  {
    title: "Secure checkout",
    body: "Industry-standard encryption keeps your payment details protected.",
    Icon: FaTrustLock,
  },
] as const;

const deliveryOptions = [
  {
    title: "Local pickup",
    body: "Collect from our New Edubiase location — we’ll notify you when your order is ready.",
    Icon: FaShop,
  },
  {
    title: "Nationwide delivery",
    body: "We ship across Ghana. Options and timelines are confirmed at checkout.",
    Icon: FaTrustTruck,
  },
] as const;

/** Single block: why shop here + delivery/pickup + visit us (replaces duplicate trust strips). */
export function HomeTrustAndLogistics() {
  const wa = whatsappHelpUrl();

  return (
    <section
      className="scroll-mt-20 border-y border-sikapa-gray-soft bg-white px-4 py-6"
      aria-labelledby="trust-heading"
    >
      <h2
        id="trust-heading"
        className="font-serif text-section-title font-semibold text-sikapa-text-primary"
      >
        Why Sikapa
      </h2>
      <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">
        Luxury beauty with clear service — quality, safe checkout, and real support.
      </p>

      <ul className="mx-auto mt-5 flex max-w-mobile flex-col gap-4">
        {values.map(({ title, body, Icon }) => (
          <li
            key={title}
            className="flex gap-3 rounded-[10px] bg-sikapa-cream/80 px-3 py-3 ring-1 ring-black/[0.04]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-sikapa-gray-soft">
              <Icon className="text-sikapa-gold" />
            </span>
            <div>
              <p className="font-sans text-body font-semibold text-sikapa-text-primary">{title}</p>
              <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">{body}</p>
            </div>
          </li>
        ))}
        <li className="flex gap-3 rounded-[10px] bg-sikapa-cream/80 px-3 py-3 ring-1 ring-black/[0.04]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-sikapa-gray-soft">
            <FaHeadset className="text-sikapa-gold" />
          </span>
          <div>
            <p className="font-sans text-body font-semibold text-sikapa-text-primary">Help when you need it</p>
            <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">
              {wa ? (
                <>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-800 underline decoration-emerald-600/40 underline-offset-2"
                  >
                    WhatsApp
                  </a>
                  {" · "}
                  <Link href="/account" className="font-medium text-sikapa-crimson underline-offset-2 hover:underline">
                    Account &amp; help
                  </Link>
                </>
              ) : (
                <Link href="/account" className="font-medium text-sikapa-crimson underline-offset-2 hover:underline">
                  Account &amp; help
                </Link>
              )}
            </p>
          </div>
        </li>
      </ul>

      <div id="delivery" className="scroll-mt-20 mt-10 border-t border-sikapa-gray-soft pt-8">
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
          Delivery &amp; pickup
        </h2>
        <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">
          Based in the Ashanti Region — choose pickup or delivery nationwide.
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {deliveryOptions.map(({ title, body, Icon }) => (
            <li
              key={title}
              className="flex gap-3 rounded-[10px] bg-sikapa-cream/90 px-3 py-3.5 ring-1 ring-black/[0.05]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-sikapa-gray-soft">
                <Icon className="text-sikapa-gold" />
              </span>
              <div>
                <p className="font-sans text-body font-semibold text-sikapa-text-primary">{title}</p>
                <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-[10px] bg-sikapa-cream/80 px-4 py-4 ring-1 ring-black/[0.06]">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-sikapa-gray-soft">
              <FaLocationPin className="text-sikapa-crimson" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sikapa-text-muted">
                Visit us
              </p>
              <p className="mt-1 font-sans text-body font-medium leading-snug text-sikapa-text-primary">
                {SIKAPA_LOCATION_LINE}
              </p>
              <p className="mt-1.5 text-small leading-relaxed text-sikapa-text-secondary">
                Pickup, advice, or browsing in person — confirm hours before you travel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
