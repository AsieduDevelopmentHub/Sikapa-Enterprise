"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatGhs } from "@/lib/mock-data";

/**
 * `/cart` is now a pure "bag editor": view lines, change quantities, remove.
 * The full shipping/payment flow moved to `/checkout` so shoppers can review
 * the bag separately from entering address + paying.
 */
export function CartPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    lines,
    setQuantity,
    removeLine,
    subtotal,
    cartSyncing,
    cartActionError,
    clearCartActionError,
  } = useCart();

  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Cart" left="back" backHref="/" right="profile" />

      {lines.length === 0 ? (
        <div className="mx-auto max-w-mobile px-4 py-14 text-center text-body text-sikapa-text-secondary dark:text-zinc-400">
          <p className="font-semibold text-sikapa-text-primary dark:text-zinc-100">Your cart is empty.</p>
          <p className="mx-auto mt-2 max-w-[280px] text-small leading-relaxed">
            Sign in when you add items so your cart is saved on this device.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="rounded-[10px] bg-sikapa-gold px-4 py-2.5 text-small font-semibold text-white"
            >
              Shop products
            </Link>
            {!user && (
              <Link
                href="/account"
                className="rounded-[10px] border border-sikapa-gray-soft bg-white px-4 py-2.5 text-small font-semibold text-sikapa-text-primary dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-mobile">
          <p className="px-5 pt-4 text-small font-medium text-sikapa-text-secondary dark:text-zinc-400">
            {itemCount} {itemCount === 1 ? "item" : "items"}
            {cartSyncing && <span className="ml-2 text-sikapa-text-muted dark:text-zinc-500">· Syncing cart…</span>}
          </p>

          {cartActionError && (
            <button
              type="button"
              className="mx-4 mt-2 w-[calc(100%-2rem)] rounded-[10px] bg-white px-3 py-2 text-left text-small text-sikapa-text-primary ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10"
              onClick={clearCartActionError}
            >
              {cartActionError}
            </button>
          )}

          <ul className="divide-y divide-sikapa-gray-soft/80 px-3 dark:divide-white/10">
            {lines.map((line) => (
              <li key={line.product.id} className="flex gap-4 px-2 py-5">
                <Link
                  href={`/product/${line.product.id}`}
                  className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-white ring-1 ring-black/[0.05] dark:bg-zinc-900 dark:ring-white/10"
                >
                  <Image src={line.product.image} alt="" fill className="object-cover" sizes="72px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/product/${line.product.id}`}
                    className="font-semibold leading-snug text-sikapa-text-primary hover:text-sikapa-gold dark:text-zinc-100"
                  >
                    {line.product.name}
                  </Link>
                  <p className="text-body font-semibold text-sikapa-gold">{formatGhs(line.product.price)}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-4 rounded-[10px] bg-sikapa-gray-soft px-2 py-1.5 dark:bg-zinc-800">
                      <button
                        type="button"
                        className="sikapa-tap flex h-8 w-8 items-center justify-center rounded-lg text-lg font-medium text-sikapa-text-primary dark:text-zinc-100"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="min-w-[1.25rem] text-center text-small font-bold text-sikapa-text-primary dark:text-zinc-100">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="sikapa-tap flex h-8 w-8 items-center justify-center rounded-lg text-lg font-medium text-sikapa-text-primary dark:text-zinc-100"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.product.id)}
                      className="text-small font-semibold text-sikapa-crimson hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mx-4 mt-2 space-y-2.5 rounded-[10px] bg-white p-4 text-body shadow-sm ring-1 ring-black/[0.05] dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex justify-between text-sikapa-text-secondary dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="text-sikapa-text-primary dark:text-zinc-100">{formatGhs(subtotal)}</span>
            </div>
            <p className="text-[11px] leading-snug text-sikapa-text-muted dark:text-zinc-500">
              Delivery and total calculated at checkout.
            </p>
          </div>

          <div className="px-4 py-6">
            <button
              type="button"
              disabled={cartSyncing || !user}
              className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-3.5 text-body font-semibold text-white disabled:opacity-50"
              onClick={() => router.push("/checkout")}
            >
              Proceed to checkout
            </button>
            {!user && (
              <p className="mt-2 text-center text-small text-sikapa-text-muted dark:text-zinc-500">
                <Link href="/account" className="font-semibold text-sikapa-gold">
                  Sign in
                </Link>{" "}
                to pay with Paystack.
              </p>
            )}
            <Link
              href="/shop"
              className="mt-3 block rounded-[10px] border border-sikapa-gray-soft bg-white py-3 text-center text-small font-semibold text-sikapa-text-primary dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
