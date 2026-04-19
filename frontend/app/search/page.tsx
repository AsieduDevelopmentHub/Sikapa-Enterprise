import { Suspense } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchResultsScreen } from "@/components/search/SearchResultsScreen";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Search", {
  description: "Search wigs, skincare, perfumes, and cosmetics across the Sikapa catalog.",
  path: "/search",
});

function SearchFallback() {
  return (
    <div className="space-y-3 bg-sikapa-cream px-4 py-4 dark:bg-zinc-950" aria-hidden>
      <div className="sikapa-skeleton h-11 w-full rounded-[10px]" />
      <div className="sikapa-skeleton h-24 w-full rounded-[10px]" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader
        variant="inner"
        title="Search"
        left="back"
        backHref="/"
        right="cart"
      />
      <Suspense fallback={<SearchFallback />}>
        <SearchResultsScreen />
      </Suspense>
    </main>
  );
}
