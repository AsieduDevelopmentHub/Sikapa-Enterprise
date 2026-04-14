"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { useAuth } from "@/context/AuthContext";
import { adminFetchCategories, type AdminCategory } from "@/lib/api/admin";

export default function AdminProductNewPage() {
  const { accessToken } = useAuth();
  const [cats, setCats] = useState<AdminCategory[]>([]);

  const loadCats = useCallback(async () => {
    if (!accessToken) return;
    try {
      setCats(await adminFetchCategories(accessToken));
    } catch {
      setCats([]);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCats();
  }, [loadCats]);

  if (!accessToken) return null;

  return (
    <div>
      <Link href="/system/products" className="text-small font-semibold text-sikapa-gold hover:underline">
        ← Products
      </Link>
      <h1 className="mt-3 font-serif text-page-title font-semibold">New product</h1>
      <div className="mt-6 max-w-2xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
        <ProductForm accessToken={accessToken} mode="create" categoryHints={cats} />
      </div>
    </div>
  );
}
