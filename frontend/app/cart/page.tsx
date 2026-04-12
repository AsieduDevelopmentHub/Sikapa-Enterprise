"use client";

import Image from "next/image";
import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatGhs } from "@/lib/mock-data";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { lines, setQuantity, subtotal, shipping, total } = useCart();
  const n = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <main className="bg-sikapa-cream">
      <ScreenHeader
        variant="inner"
        title="Cart"
        left="back"
        backHref="/"
        right="bag"
      />

      {lines.length === 0 ? (
        <div className="px-4 py-14 text-center text-body text-sikapa-text-secondary">
          <p>Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block font-semibold text-sikapa-crimson hover:underline"
          >
            Shop products
          </Link>
        </div>
      ) : (
        <>
          <p className="px-5 pt-4 text-small font-medium text-sikapa-text-secondary">
            {n} {n === 1 ? "item" : "items"}
          </p>
          <ul className="divide-y divide-sikapa-gray-soft/80 px-3">
            {lines.map((line) => (
              <li key={line.product.id} className="flex gap-4 px-2 py-5">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-white ring-1 ring-black/[0.05]">
                  <Image
                    src={line.product.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-semibold leading-snug text-sikapa-text-primary">
                    {line.product.name}
                  </p>
                  <p className="text-body font-semibold text-sikapa-gold">
                    {formatGhs(line.product.price)}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-4 rounded-[10px] bg-sikapa-gray-soft px-2 py-1.5">
                    <button
                      type="button"
                      className="sikapa-tap flex h-8 w-8 items-center justify-center rounded-lg text-lg font-medium text-sikapa-text-primary"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-[1.25rem] text-center text-small font-bold text-sikapa-text-primary">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="sikapa-tap flex h-8 w-8 items-center justify-center rounded-lg text-lg font-medium text-sikapa-text-primary"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mx-4 mt-2 space-y-2.5 rounded-[10px] bg-white p-4 text-body shadow-sm ring-1 ring-black/[0.05]">
            <div className="flex justify-between text-sikapa-text-secondary">
              <span>Subtotal</span>
              <span className="text-sikapa-text-primary">{formatGhs(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sikapa-text-secondary">
              <span>Shipping</span>
              <span className="text-sikapa-text-primary">{formatGhs(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-sikapa-gray-soft pt-3 font-bold text-sikapa-text-primary">
              <span>Total</span>
              <span>{formatGhs(total)}</span>
            </div>
          </div>

          <div className="px-4 py-6">
            <button
              type="button"
              className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-3.5 text-body font-semibold text-white"
            >
              Checkout – {formatGhs(total)}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
