"use client";

export default function AdminCouponsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-page-title font-semibold">Coupons & discounts</h1>
      <p className="mt-2 text-small text-sikapa-text-secondary">
        Discount codes, usage caps, and expirations are not in the API yet. This module is reserved for a future
        migration (coupon model + checkout application).
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-sikapa-gold/40 bg-sikapa-cream/80 p-6 text-small text-sikapa-text-secondary">
        Planned fields: code, percent or fixed amount, max redemptions, valid-from / valid-to, per-user limits, and
        analytics on redemptions.
      </div>
    </div>
  );
}
