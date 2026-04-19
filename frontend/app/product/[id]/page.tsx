import type { Metadata } from "next";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ProductDetailContainer } from "@/components/ProductDetailContainer";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return pageMetadata("Product", {
    description:
      "View product details, images, variants, reviews, and add to cart — Sikapa Enterprise secure checkout.",
    path: `/product/${id}`,
  });
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader
        variant="inner"
        title="Product"
        left="back"
        backHref="/shop"
        right="wishlist"
      />
      <ProductDetailContainer id={id} />
    </main>
  );
}
