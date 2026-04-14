"use client";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-page-title font-semibold">Settings</h1>
      <p className="mt-2 text-small text-sikapa-text-secondary">
        Store-wide configuration (delivery fees, payment toggles, business profile) lives in environment variables and
        backend code today.
      </p>
      <ul className="mt-6 list-inside list-disc space-y-2 text-small text-sikapa-text-secondary">
        <li>
          <code className="rounded bg-white px-1 py-0.5 text-[11px] ring-1 ring-black/[0.06]">FRONTEND_URL</code>,{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[11px] ring-1 ring-black/[0.06]">PAYSTACK_*</code>, CORS,
          and email branding: see <code className="text-[11px]">backend/.env.example</code> and{" "}
          <code className="text-[11px]">docs/OPERATIONS.md</code>.
        </li>
        <li>Delivery regions and fees: <code className="text-[11px]">app/core/ghana_shipping.py</code></li>
      </ul>
    </div>
  );
}
