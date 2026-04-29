"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SkeletonBlock } from "@/components/StorefrontSkeletons";
import { useAuth } from "@/context/AuthContext";
import { ScreenHeader } from "@/components/ScreenHeader";
import { returnsList, type OrderReturn } from "@/lib/api/returns";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function ReturnsContent() {
  const { accessToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOrder = searchParams.get("order");

  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [orderId, setOrderId] = useState(presetOrder ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!accessToken) {
      setReturns([]);
      return;
    }

    const load = async () => {
      try {
        const list = await returnsList(accessToken);
        setReturns(list);
      } catch {
        setReturns([]);
      }
    };

    void load();
  }, [accessToken]);

  const submit = async () => {
    if (!accessToken) {
      setMessage("Sign in first.");
      return;
    }

    const id = Number(orderId);
    if (!Number.isFinite(id) || id <= 0) {
      setMessage("Enter a valid order number.");
      return;
    }
    setMessage("");
    setReturns(await returnsList(accessToken).catch(() => []));
    router.push(`/orders/${id}/return`);
  };

  if (authLoading && !accessToken) {
    return (
      <main className="bg-sikapa-cream dark:bg-zinc-950">
        <ScreenHeader variant="inner" title="Returns" left="back" backHref="/account" right="none" />
        <div className="mx-auto max-w-mobile space-y-4 px-4 py-10" aria-hidden>
          <SkeletonBlock className="h-6 w-24 rounded" />
          <SkeletonBlock className="h-24 w-full rounded-[12px]" />
        </div>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className="bg-sikapa-cream dark:bg-zinc-950">
        <ScreenHeader variant="inner" title="Returns" left="back" backHref="/account" right="none" />
        <div className="mx-auto max-w-mobile px-4 py-14">
          <p className="text-small text-sikapa-text-secondary">Sign in to manage returns.</p>
          <Link href="/auth/login" className="mt-4 inline-block font-semibold text-sikapa-gold hover:underline">
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Returns" left="back" backHref="/account" right="none" />
      <div className="mx-auto max-w-mobile space-y-6 px-4 py-8">
        <p className="text-small leading-relaxed text-sikapa-text-secondary">
          Open a return for a recent order. Our team will follow up by email.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
            <h2 className="font-display text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              New request
            </h2>

            <div className="mt-4 space-y-4">
              <label className="block text-small font-medium text-sikapa-text-secondary">
                Order ID
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-body dark:border-white/10 dark:bg-zinc-900"
                  placeholder="e.g. 12"
                />
              </label>

              <p className="text-small text-sikapa-text-secondary">
                We&apos;ll collect the reason on the next screen (item selection + details).
              </p>
            </div>

            {message ? <p className="mt-4 text-small text-sikapa-text-secondary">{message}</p> : null}

            <button
              type="button"
              onClick={() => void submit()}
              className="sikapa-btn-gold sikapa-tap mt-4 w-full rounded-[10px] py-2.5 text-small font-semibold text-white disabled:opacity-60"
            >
              Continue to request
            </button>
          </section>

          <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
            <h2 className="font-display text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              Your requests
            </h2>

            <ul className="mt-4 space-y-3">
              {returns.map((r) => (
                <li key={r.id} className="rounded-xl border border-sikapa-gray-soft bg-white p-4 text-small">
                  <p className="font-semibold">
                    Order #{r.order_id} · <span className="capitalize">{r.status}</span>
                  </p>
                  <p className="mt-1 text-sikapa-text-secondary">{r.reason}</p>
                  <p className="mt-2 text-[11px] text-sikapa-text-secondary">
                    Outcome: <span className="font-medium text-sikapa-text-primary">{r.preferred_outcome}</span>
                  </p>
                  {r.resolved_at ? (
                    <p className="mt-1 text-[11px] text-sikapa-text-secondary">
                      Resolved:{" "}
                      <span className="font-medium text-sikapa-text-primary">{formatWhen(r.resolved_at)}</span>
                    </p>
                  ) : null}
                  {r.admin_notes ? (
                    <p className="mt-1 text-[11px] text-sikapa-text-secondary">
                      Update: <span className="font-medium text-sikapa-text-primary">{r.admin_notes}</span>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            {returns.length === 0 ? <p className="mt-4 text-small text-sikapa-text-secondary">No return requests yet.</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-sikapa-cream dark:bg-zinc-950" aria-hidden>
          <div className="mx-auto max-w-mobile space-y-4 px-4 py-10">
            <SkeletonBlock className="h-6 w-24 rounded" />
            <SkeletonBlock className="h-24 w-full rounded-[12px]" />
            <SkeletonBlock className="h-24 w-full rounded-[12px]" />
          </div>
        </main>
      }
    >
      <ReturnsContent />
    </Suspense>
  );
}

