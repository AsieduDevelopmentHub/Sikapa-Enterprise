import { ScreenHeader } from "@/components/ScreenHeader";
import { ProductDetailContainer } from "@/components/ProductDetailContainer";

type Props = { params: Promise<{ id: string }> };

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
