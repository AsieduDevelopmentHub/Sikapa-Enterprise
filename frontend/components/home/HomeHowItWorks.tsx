"use client";

import Link from "next/link";
import { FaCart, FaShop, FaTrustLock } from "@/components/FaIcons";

const steps = [
  {
    step: "1",
    title: "Browse",
    body: "Filter by category and discover products tailored to you.",
    href: "/shop",
    cta: "Open shop",
    Icon: FaShop,
  },
  {
    step: "2",
    title: "Bag it",
    body: "Add favourites to your cart and adjust quantities anytime.",
    href: "/cart",
    cta: "View cart",
    Icon: FaCart,
  },
  {
    step: "3",
    title: "Checkout",
    body: "Review your order and pay securely when you are ready.",
    href: "/cart",
    cta: "Go to checkout",
    Icon: FaTrustLock,
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-sikapa-cream px-4 py-7"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-mobile">
        <h2
          id="how-heading"
          className="text-center font-serif text-section-title font-semibold text-sikapa-text-primary sm:text-[1.125rem]"
        >
          Shop in three steps
        </h2>
        <p className="mx-auto mt-2 max-w-[280px] text-center text-small text-sikapa-text-secondary">
          From discovery to doorstep — a simple flow, built for mobile.
        </p>
        <ol className="mt-6 space-y-4">
          {steps.map(({ step, title, body, href, cta, Icon }) => (
            <li
              key={step}
              className="flex gap-3 rounded-[10px] bg-white p-4 shadow-sm ring-1 ring-black/[0.05]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sikapa-crimson text-small font-bold text-white">
                {step}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="text-sikapa-gold" />
                  <p className="font-sans text-body font-semibold text-sikapa-text-primary">{title}</p>
                </div>
                <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">{body}</p>
                <Link
                  href={href}
                  className="mt-2 inline-block text-small font-semibold text-sikapa-crimson hover:underline"
                >
                  {cta} →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
