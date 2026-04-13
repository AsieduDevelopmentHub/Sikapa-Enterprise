"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ordersCreate } from "@/lib/api/orders";
import { paystackInitialize, paystackVerify } from "@/lib/api/payments";
import { formatGhs } from "@/lib/mock-data";

export function CartPageClient() {
  const searchParams = useSearchParams();
  const paidRef = searchParams.get("reference") ?? searchParams.get("trxref");
  const { user, accessToken } = useAuth();
  const { lines, setQuantity, subtotal, shipping, total, cartSyncing } = useCart();
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const n = lines.reduce((s, l) => s + l.quantity, 0);

  const paystackReturnDone = useRef(false);

  useEffect(() => {
    if (!paidRef || !accessToken || paystackReturnDone.current) return;
    paystackReturnDone.current = true;
    let cancelled = false;
    (async () => {
      setCheckoutBusy(true);
      setCheckoutMsg(null);
      try {
        const v = await paystackVerify(accessToken, paidRef);
        if (cancelled) return;
        setCheckoutMsg(
          v.status === "success" || v.already_confirmed
            ? "Payment confirmed. Thank you!"
            : `Payment status: ${v.status}`
        );
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", "/cart");
        }
      } catch (e) {
        if (!cancelled) setCheckoutMsg(e instanceof Error ? e.message : "Could not verify payment");
      } finally {
        if (!cancelled) setCheckoutBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paidRef, accessToken]);

  const onCheckout = async () => {
    if (!accessToken || !user) {
      setCheckoutMsg("Sign in to checkout.");
      return;
    }
    const addr = shippingAddress.trim();
    if (addr.length < 12) {
      setCheckoutMsg("Enter a full delivery address (street, area, and city).");
      return;
    }
    setCheckoutBusy(true);
    setCheckoutMsg(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = `${origin}/cart`;
      const notesTrim = orderNotes.trim();
      const order = await ordersCreate(accessToken, {
        shipping_address: addr,
        notes: notesTrim.length > 0 ? notesTrim : null,
      });
      const pay = await paystackInitialize(accessToken, order.id, callbackUrl);
      if (typeof window !== "undefined" && pay.authorization_url) {
        window.location.href = pay.authorization_url;
      }
    } catch (e) {
      setCheckoutMsg(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckoutBusy(false);
    }
  };

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
          <p className="mx-auto mt-2 max-w-[280px] text-small leading-relaxed">
            Sign in when you add items so your cart is saved on this device.
          </p>
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
            {cartSyncing && (
              <span className="ml-2 text-sikapa-text-muted">· Syncing cart…</span>
            )}
          </p>
          {checkoutMsg && (
            <p className="mx-4 mt-2 rounded-[10px] bg-white px-3 py-2 text-small text-sikapa-text-primary ring-1 ring-black/[0.06]">
              {checkoutMsg}
            </p>
          )}
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

          {user && (
            <div className="mx-4 mt-4 space-y-3 rounded-[12px] bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
              <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Delivery</h2>
              <div>
                <label htmlFor="cart-ship-addr" className="text-small font-medium text-sikapa-text-primary">
                  Shipping address
                </label>
                <textarea
                  id="cart-ship-addr"
                  required
                  rows={4}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, house number, landmark, city, region"
                  className="mt-1 w-full resize-y rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
                />
              </div>
              <div>
                <label htmlFor="cart-notes" className="text-small font-medium text-sikapa-text-primary">
                  Order notes <span className="font-normal text-sikapa-text-muted">(optional)</span>
                </label>
                <textarea
                  id="cart-notes"
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Delivery instructions or gift message"
                  className="mt-1 w-full resize-y rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
                />
              </div>
            </div>
          )}

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
              disabled={checkoutBusy || cartSyncing || !user}
              className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-3.5 text-body font-semibold text-white disabled:opacity-50"
              onClick={() => void onCheckout()}
            >
              {checkoutBusy ? "Redirecting…" : `Checkout – ${formatGhs(total)}`}
            </button>
            {!user && (
              <p className="mt-2 text-center text-small text-sikapa-text-muted">
                <Link href="/account" className="font-semibold text-sikapa-gold">
                  Sign in
                </Link>{" "}
                to pay with Paystack.
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
