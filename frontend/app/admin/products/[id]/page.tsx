"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { useAuth } from "@/context/AuthContext";
import { adminFetchCategories, adminFetchProduct, type AdminCategory, type AdminProduct } from "@/lib/api/admin";

export default function AdminProductEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const { accessToken } = useAuth();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [err, setErr] = useState<string | null>(null);

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
      <Link href="/admin/products" className="text-small font-semibold text-sikapa-gold hover:underline">
        ← Products
      </Link>
      <h1 className="mt-3 font-serif text-page-title font-semibold">Edit product</h1>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      {!product && !err && <p className="mt-6 text-small text-sikapa-text-muted">Loading…</p>}
      {product && (
        <div className="mt-6 max-w-2xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
          <ProductForm
            accessToken={accessToken}
            mode="edit"
            productId={id}
            initial={product}
            categoryHints={cats}
          />
        </div>
      )}
    </div>
  );
}
