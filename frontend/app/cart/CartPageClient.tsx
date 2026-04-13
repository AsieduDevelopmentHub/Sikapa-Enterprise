"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ordersCreate } from "@/lib/api/orders";
import { paystackInitialize } from "@/lib/api/payments";
import {
  DELIVERY_COURIER_OPTIONS,
  GHANA_CITY_OTHER,
  GHANA_REGIONS,
  citiesForRegion,
  deliveryFeeFor,
  splitCityForRegion,
  type ShippingMethodClient,
} from "@/lib/ghana-shipping";
import { formatGhs } from "@/lib/mock-data";
import { sanitizeMultiline, validateShippingAddress } from "@/lib/validation/input";

export function CartPageClient() {
  const { user, accessToken } = useAuth();
  const {
    lines,
    setQuantity,
    subtotal,
    cartSyncing,
    cartActionError,
    clearCartActionError,
  } = useCart();
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodClient>("pickup");
  const [shippingRegion, setShippingRegion] = useState<string>(GHANA_REGIONS[0]?.slug ?? "greater-accra");
  const [shippingProvider, setShippingProvider] = useState<string>(DELIVERY_COURIER_OPTIONS[0] ?? "Station driver");
  const [cityPick, setCityPick] = useState(
    () => citiesForRegion(GHANA_REGIONS[0]?.slug ?? "greater-accra")[0] ?? GHANA_CITY_OTHER,
  );
  const [cityOther, setCityOther] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [useDefaultContact, setUseDefaultContact] = useState(true);
  const [shippingContactName, setShippingContactName] = useState("");
  const [shippingContactPhone, setShippingContactPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const n = lines.reduce((s, l) => s + l.quantity, 0);

  const hasSavedShipping = useMemo(
    () =>
      !!(
        user?.shipping_region?.trim() &&
        user?.shipping_city?.trim() &&
        user?.shipping_address_line1?.trim()
      ),
    [user]
  );

  const [useSavedShipping, setUseSavedShipping] = useState(false);

  useEffect(() => {
    setUseSavedShipping(!!hasSavedShipping);
  }, [hasSavedShipping]);

  const deliveryFee = useMemo(() => {
    const regionForFee =
      shippingMethod === "delivery"
        ? useSavedShipping && hasSavedShipping
          ? user?.shipping_region ?? null
          : shippingRegion
        : null;
    return deliveryFeeFor(shippingMethod, regionForFee);
  }, [shippingMethod, shippingRegion, useSavedShipping, hasSavedShipping, user?.shipping_region]);

  const checkoutTotal = subtotal + deliveryFee;

  const onRegionChange = useCallback((slug: string) => {
    setShippingRegion(slug);
    const list = citiesForRegion(slug);
    setCityPick(list[0] ?? GHANA_CITY_OTHER);
    setCityOther("");
  }, []);

  useEffect(() => {
    if (!user) return;
    const reg = user.shipping_region?.trim() || GHANA_REGIONS[0]?.slug || "greater-accra";
    if (user.shipping_region?.trim()) setShippingRegion(user.shipping_region.trim());
    const { pick, other } = splitCityForRegion(reg, user.shipping_city);
    if (user.shipping_city?.trim() || user.shipping_address_line1?.trim()) {
      setCityPick(pick);
      setCityOther(other);
    } else {
      const list = citiesForRegion(reg);
      setCityPick(list[0] ?? GHANA_CITY_OTHER);
      setCityOther("");
    }
    const line1 = user.shipping_address_line1?.trim() || "";
    const line2 = user.shipping_address_line2?.trim() || "";
    const landmark = user.shipping_landmark?.trim() || "";
    const merged = [line1, line2, landmark ? `Landmark: ${landmark}` : ""].filter(Boolean).join(", ");
    if (merged) setShippingAddress(merged);
    if (user.shipping_contact_name) setShippingContactName(user.shipping_contact_name);
    if (user.shipping_contact_phone) setShippingContactPhone(user.shipping_contact_phone);
  }, [user]);

  const onCheckout = async () => {
    if (!accessToken || !user) {
      setCheckoutMsg("Sign in to checkout.");
      return;
    }
    const notesTrim = sanitizeMultiline(orderNotes, 2000).trim();
    let addr: string | null = null;
    let effRegion = "";
    let effCity = "";
    if (shippingMethod === "delivery") {
      const usingSaved = useSavedShipping && hasSavedShipping;
      if (usingSaved) {
        effRegion = (user.shipping_region ?? "").trim();
        effCity = (user.shipping_city ?? "").trim();
        addr = [
          user.shipping_address_line1,
          user.shipping_address_line2,
          user.shipping_landmark ? `Landmark: ${user.shipping_landmark}` : "",
        ]
          .filter(Boolean)
          .join(", ");
        const rawSaved = sanitizeMultiline(addr, 2000);
        const addrErrSaved = validateShippingAddress(rawSaved);
        if (addrErrSaved) {
          setCheckoutMsg(addrErrSaved);
          return;
        }
      } else {
        effRegion = shippingRegion.trim();
        effCity = (cityPick === GHANA_CITY_OTHER ? cityOther : cityPick).trim();
        const raw = sanitizeMultiline(shippingAddress, 2000);
        const addrErr = validateShippingAddress(raw);
        if (addrErr) {
          setCheckoutMsg(addrErr);
          return;
        }
        addr = raw;
      }
      if (!effRegion) {
        setCheckoutMsg("Choose your region for delivery.");
        return;
      }
      if (!effCity) {
        setCheckoutMsg("Choose or enter your city for delivery.");
        return;
      }
      if (!shippingProvider.trim()) {
        setCheckoutMsg("Choose a courier.");
        return;
      }
      const nameSource = useDefaultContact
        ? (user.shipping_contact_name || user.name || "").trim()
        : shippingContactName.trim();
      const phoneSource = useDefaultContact ? (user.shipping_contact_phone || user.phone || "").trim() : shippingContactPhone.trim();
      if (!nameSource) {
        setCheckoutMsg("Enter a delivery contact name.");
        return;
      }
      if (!phoneSource) {
        setCheckoutMsg("Enter a delivery contact phone.");
        return;
      }
    } else {
      const t = sanitizeMultiline(shippingAddress, 2000).trim();
      addr = t.length > 0 ? t : null;
    }

    setCheckoutBusy(true);
    setCheckoutMsg(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const order = await ordersCreate(accessToken, {
        shipping_method: shippingMethod,
        shipping_region: shippingMethod === "delivery" ? effRegion : null,
        shipping_city: shippingMethod === "delivery" ? effCity : null,
        shipping_provider: shippingMethod === "delivery" ? shippingProvider.trim() : null,
        shipping_contact_name:
          shippingMethod === "delivery"
            ? (
                useDefaultContact
                  ? (user.shipping_contact_name || user.name || "").trim()
                  : shippingContactName.trim()
              ) || null
            : null,
        shipping_contact_phone:
          shippingMethod === "delivery"
            ? (
                useDefaultContact
                  ? (user.shipping_contact_phone || user.phone || "").trim()
                  : shippingContactPhone.trim()
              ) || null
            : null,
        shipping_address: addr,
        notes: notesTrim.length > 0 ? notesTrim : null,
      });
      const callbackUrl = `${origin}/orders/${order.id}`;
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
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Cart" left="back" backHref="/" right="bag" />

      {lines.length === 0 ? (
        <div className="px-4 py-14 text-center text-body text-sikapa-text-secondary dark:text-zinc-400">
          <p>Your cart is empty.</p>
          <p className="mx-auto mt-2 max-w-[280px] text-small leading-relaxed">
            Sign in when you add items so your cart is saved on this device.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block font-semibold text-sikapa-crimson hover:underline dark:text-amber-300"
          >
            Shop products
          </Link>
        </div>
      ) : (
        <>
          <p className="px-5 pt-4 text-small font-medium text-sikapa-text-secondary dark:text-zinc-400">
            {n} {n === 1 ? "item" : "items"}
            {cartSyncing && <span className="ml-2 text-sikapa-text-muted dark:text-zinc-500">· Syncing cart…</span>}
          </p>
          {(checkoutMsg || cartActionError) && (
            <button
              type="button"
              className="mx-4 mt-2 w-[calc(100%-2rem)] rounded-[10px] bg-white px-3 py-2 text-left text-small text-sikapa-text-primary ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10"
              onClick={() => {
                setCheckoutMsg(null);
                clearCartActionError();
              }}
            >
              {checkoutMsg ?? cartActionError}
            </button>
          )}
          <ul className="divide-y divide-sikapa-gray-soft/80 px-3 dark:divide-white/10">
            {lines.map((line) => (
              <li key={line.product.id} className="flex gap-4 px-2 py-5">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-white ring-1 ring-black/[0.05] dark:bg-zinc-900 dark:ring-white/10">
                  <Image src={line.product.image} alt="" fill className="object-cover" sizes="72px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-semibold leading-snug text-sikapa-text-primary dark:text-zinc-100">
                    {line.product.name}
                  </p>
                  <p className="text-body font-semibold text-sikapa-gold">{formatGhs(line.product.price)}</p>
                  <div className="mt-2 inline-flex items-center gap-4 rounded-[10px] bg-sikapa-gray-soft px-2 py-1.5 dark:bg-zinc-800">
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
                </div>
              </li>
            ))}
          </ul>

          {user && (
            <div className="mx-4 mt-4 space-y-4 rounded-[12px] bg-white p-4 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
              <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
                Shipping & delivery
              </h2>
              <fieldset className="space-y-2">
                <legend className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">Method</legend>
                <label className="flex cursor-pointer items-center gap-2 text-body text-sikapa-text-secondary dark:text-zinc-300">
                  <input
                    type="radio"
                    name="ship-method"
                    checked={shippingMethod === "pickup"}
                    onChange={() => setShippingMethod("pickup")}
                    className="accent-sikapa-gold"
                  />
                  Local pickup (GH₵0)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-body text-sikapa-text-secondary dark:text-zinc-300">
                  <input
                    type="radio"
                    name="ship-method"
                    checked={shippingMethod === "delivery"}
                    onChange={() => setShippingMethod("delivery")}
                    className="accent-sikapa-gold"
                  />
                  Delivery to your address
                </label>
              </fieldset>

              {shippingMethod === "delivery" && hasSavedShipping && (
                <label className="flex cursor-pointer items-start gap-2 text-body text-sikapa-text-secondary dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={useSavedShipping}
                    onChange={(e) => setUseSavedShipping(e.target.checked)}
                    className="accent-sikapa-gold mt-1"
                  />
                  <span>
                    <span className="font-semibold text-sikapa-text-primary dark:text-zinc-100">Use my saved address</span>
                    <span className="mt-1 block text-small leading-relaxed text-sikapa-text-muted dark:text-zinc-500">
                      From your account: {user.shipping_region} · {user.shipping_city}
                    </span>
                  </span>
                </label>
              )}

              {shippingMethod === "delivery" && useSavedShipping && hasSavedShipping && (
                <div className="rounded-[10px] bg-sikapa-cream/80 px-3 py-2.5 text-small text-sikapa-text-secondary dark:bg-zinc-800 dark:text-zinc-300">
                  <p className="font-medium text-sikapa-text-primary dark:text-zinc-100">Delivering to</p>
                  <p className="mt-1">
                    {[user.shipping_address_line1, user.shipping_address_line2].filter(Boolean).join(", ")}
                  </p>
                  {user.shipping_landmark?.trim() ? <p className="mt-0.5">Landmark: {user.shipping_landmark}</p> : null}
                </div>
              )}

              {shippingMethod === "delivery" && (!hasSavedShipping || !useSavedShipping) && (
                <>
                  <div>
                    <label htmlFor="cart-region" className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                      Region (Ghana)
                    </label>
                    <select
                      id="cart-region"
                      value={shippingRegion}
                      onChange={(e) => onRegionChange(e.target.value)}
                      className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                    >
                      {GHANA_REGIONS.map((r) => (
                        <option key={r.slug} value={r.slug}>
                          {r.label} — {formatGhs(r.feeGhs)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cart-city" className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                      City / town
                    </label>
                    <select
                      id="cart-city"
                      value={cityPick}
                      onChange={(e) => {
                        setCityPick(e.target.value);
                        if (e.target.value !== GHANA_CITY_OTHER) setCityOther("");
                      }}
                      className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                    >
                      {citiesForRegion(shippingRegion).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {cityPick === GHANA_CITY_OTHER && (
                      <input
                        id="cart-city-other"
                        value={cityOther}
                        onChange={(e) => setCityOther(e.target.value)}
                        placeholder="Enter your city or town"
                        className="mt-2 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                      />
                    )}
                  </div>
                </>
              )}

              {shippingMethod === "delivery" && (
                <>
                  <div>
                    <label htmlFor="cart-courier" className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                      Courier / service
                    </label>
                    <select
                      id="cart-courier"
                      value={shippingProvider}
                      onChange={(e) => setShippingProvider(e.target.value)}
                      className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                    >
                      {DELIVERY_COURIER_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">Delivery contact</p>
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-small text-sikapa-text-secondary dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={useDefaultContact}
                        onChange={(e) => setUseDefaultContact(e.target.checked)}
                        className="accent-sikapa-gold"
                      />
                      Use account contact ({(user.shipping_contact_name || user.name || "No name set").trim()} ·{" "}
                      {(user.shipping_contact_phone || user.phone || "No phone set").trim()})
                    </label>
                  </div>
                  {!useDefaultContact && (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label
                          htmlFor="cart-contact-name"
                          className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200"
                        >
                          Contact name
                        </label>
                        <input
                          id="cart-contact-name"
                          value={shippingContactName}
                          onChange={(e) => setShippingContactName(e.target.value)}
                          className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="cart-contact-phone"
                          className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200"
                        >
                          Contact phone
                        </label>
                        <input
                          id="cart-contact-phone"
                          value={shippingContactPhone}
                          onChange={(e) => setShippingContactPhone(e.target.value)}
                          className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                        />
                      </div>
                    </div>
                  )}
                  {(!hasSavedShipping || !useSavedShipping) && (
                    <div>
                      <label htmlFor="cart-ship-addr" className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                        Delivery address <span className="text-sikapa-crimson">*</span>
                      </label>
                      <textarea
                        id="cart-ship-addr"
                        required={shippingMethod === "delivery"}
                        rows={4}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Example: 22 Oxford Street Osu Accra (write naturally — commas optional)"
                        className="mt-1 w-full resize-y rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body text-sikapa-text-primary ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                      />
                    </div>
                  )}
                </>
              )}

              {shippingMethod === "pickup" && (
                <p className="text-small text-sikapa-text-secondary dark:text-zinc-400">
                  Pickup is free. Optional: add a note or phone for the pickup desk below.
                </p>
              )}

              <div>
                <label htmlFor="cart-notes" className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                  Order notes <span className="font-normal text-sikapa-text-muted dark:text-zinc-500">(optional)</span>
                </label>
                <textarea
                  id="cart-notes"
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Delivery instructions, pickup name, or gift message"
                  className="mt-1 w-full resize-y rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body text-sikapa-text-primary ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                />
              </div>
            </div>
          )}

          <div className="mx-4 mt-2 space-y-2.5 rounded-[10px] bg-white p-4 text-body shadow-sm ring-1 ring-black/[0.05] dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex justify-between text-sikapa-text-secondary dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="text-sikapa-text-primary dark:text-zinc-100">{formatGhs(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sikapa-text-secondary dark:text-zinc-400">
              <span>Delivery</span>
              <span className="text-sikapa-text-primary dark:text-zinc-100">{formatGhs(deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-sikapa-gray-soft pt-3 font-bold text-sikapa-text-primary dark:border-white/10 dark:text-zinc-100">
              <span>Total</span>
              <span>{formatGhs(checkoutTotal)}</span>
            </div>
          </div>

          <div className="px-4 py-6">
            <button
              type="button"
              disabled={checkoutBusy || cartSyncing || !user}
              className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-3.5 text-body font-semibold text-white disabled:opacity-50"
              onClick={() => void onCheckout()}
            >
              {checkoutBusy ? "Redirecting…" : `Checkout – ${formatGhs(checkoutTotal)}`}
            </button>
            {!user && (
              <p className="mt-2 text-center text-small text-sikapa-text-muted dark:text-zinc-500">
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
