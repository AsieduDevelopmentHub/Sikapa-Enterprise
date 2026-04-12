"use client";

import { FaTrustAuthentic, FaTrustLock, FaTrustTruck } from "@/components/FaIcons";

const items = [
  {
    title: "Reliable delivery",
    body: "Careful packing and tracking-ready fulfilment for your orders.",
    Icon: FaTrustTruck,
  },
  {
    title: "Secure checkout",
    body: "Your payment details are protected with industry-standard security.",
    Icon: FaTrustLock,
  },
  {
    title: "Curated quality",
    body: "Products chosen for performance, safety, and inclusive beauty.",
    Icon: FaTrustAuthentic,
  },
] as const;

export function HomeTrustStrip() {
  return (
    <section
      id="trust"
      className="scroll-mt-20 border-y border-sikapa-gray-soft bg-white px-4 py-6"
      aria-labelledby="trust-heading"
    >
      <h2 id="trust-heading" className="sr-only">
        Why shop with Sikapa
      </h2>
      <ul className="mx-auto flex max-w-mobile flex-col gap-5 sm:gap-6">
        {items.map(({ title, body, Icon }) => (
          <li key={title} className="flex gap-3 rounded-[10px] bg-sikapa-cream/80 px-3 py-3 ring-1 ring-black/[0.04]">
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
    </section>
  );
}
