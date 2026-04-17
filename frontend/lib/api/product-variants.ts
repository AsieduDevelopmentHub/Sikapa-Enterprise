import { apiFetchJson } from "@/lib/api/client";
import { V1 } from "@/lib/api/v1-paths";

export type ProductVariantPublic = {
  id: number;
  product_id: number;
  name: string;
  sku?: string | null;
  attributes?: Record<string, unknown> | null;
  price_delta: number;
  in_stock: number;
};

export async function fetchProductVariants(productId: number): Promise<ProductVariantPublic[]> {
  return apiFetchJson<ProductVariantPublic[]>(V1.productVariants.listForProduct(productId));
}
