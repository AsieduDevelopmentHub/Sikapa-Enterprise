import type { QueryClient } from "@tanstack/react-query";

/** Fired after admin catalog mutations so open storefront tabs can refresh. */
export const CATALOG_CHANGED_EVENT = "sikapa-catalog-changed";

export async function invalidateCatalogQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["products"] }),
    queryClient.invalidateQueries({ queryKey: ["categories"] }),
  ]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CATALOG_CHANGED_EVENT));
  }
}
