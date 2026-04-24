import type { Metadata } from "next";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ProductDetailContainer } from "@/components/ProductDetailContainer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { pageMetadata } from "@/lib/seo";
import { fetchProductById } from "@/lib/api/products"; 
import { publicSiteBaseUrl } from "@/lib/site";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;

  return pageMetadata("Product", {
    description:
      "View product details, images, variants, reviews, and add to cart — Sikapa Enterprise secure checkout.",
    path: `/product/${id}`,
  });
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  // Fetch the actual product details here
  const product = await fetchProductById(Number(id));

  const productUrl = `${publicSiteBaseUrl()}/product/${id}`;

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

      <WhatsAppFloat
        productName={product?.name}
        productPrice={
          product?.price ? `GH₵ ${product.price}` : undefined
        }
        // productSku={product?.sku}
        productUrl={productUrl}
      />
    </main>
  );
}