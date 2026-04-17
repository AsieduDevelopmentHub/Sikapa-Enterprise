"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductVariantsManager } from "@/components/admin/ProductVariantsManager";
import { useAuth } from "@/context/AuthContext";
import { adminFetchCategories, adminFetchProduct, type AdminCategory, type AdminProduct } from "@/lib/api/admin";
import { getBackendOrigin } from "@/lib/api/client";
import { formatGhs } from "@/lib/mock-data";

export default function AdminProductEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const { accessToken } = useAuth();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? getBackendOrigin() : "";

  const load = useCallback(async () => {
    if (!accessToken || !Number.isFinite(id)) return;
    setErr(null);
    try {
      const [p, c] = await Promise.all([
        adminFetchProduct(accessToken, id),
        adminFetchCategories(accessToken),
      ]);
      setProduct(p);
      setCats(c);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [accessToken, id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!accessToken) return null;

  return (
    <div>
      <Link href="/system/products" className="text-small font-semibold text-sikapa-gold hover:underline">
        ← Products
      </Link>
      <h1 className="mt-3 font-serif text-page-title font-semibold">Edit product</h1>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      {!product && !err && <p className="mt-6 text-small text-sikapa-text-muted">Loading…</p>}
      {product && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.2fr]">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
            <h2 className="font-serif text-section-title font-semibold">Product details</h2>
            <div className="mt-4 space-y-3 text-small">
              <div className="h-44 overflow-hidden rounded-lg bg-sikapa-gray-soft">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url.startsWith("http") ? product.image_url : `${origin}${product.image_url}`}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <p className="font-semibold text-sikapa-text-primary">{product.name}</p>
              <p className="text-sikapa-text-muted">{product.description || "No description yet."}</p>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-sikapa-cream p-3">
                <p>Price</p>
                <p className="text-right font-semibold">{formatGhs(product.price)}</p>
                <p>Stock</p>
                <p className="text-right font-semibold">{product.in_stock}</p>
                <p>Status</p>
                <p className="text-right font-semibold">{product.is_active ? "Live" : "Hidden"}</p>
                <p>Category</p>
                <p className="text-right font-semibold">{product.category || "—"}</p>
                <p>SKU</p>
                <p className="text-right font-semibold">{product.sku || "—"}</p>
                <p>Slug</p>
                <p className="text-right font-mono text-[11px]">{product.slug}</p>
              </div>
            </div>
          </section>
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]" id="edit">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-section-title font-semibold">Edit product</h2>
              <span className="rounded-full bg-sikapa-cream px-3 py-1 text-[11px] font-semibold text-sikapa-text-muted">
                Product #{id}
              </span>
            </div>
            <ProductForm
              accessToken={accessToken}
              mode="edit"
              productId={id}
              initial={product}
              categoryHints={cats}
            />
          </section>
        </div>
      )}
      {product && (
        <div className="mt-6">
          <ProductVariantsManager accessToken={accessToken} productId={id} />
        </div>
      )}
    </div>
  );
}
