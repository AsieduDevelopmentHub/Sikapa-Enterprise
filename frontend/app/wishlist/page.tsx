import { ScreenHeader } from "@/components/ScreenHeader";
import { WishlistScreen } from "@/components/wishlist/WishlistScreen";

export const metadata = {
  title: "Wishlist · Sikapa Enterprise",
  description: "The products you saved on Sikapa Enterprise.",
};

export default function WishlistPage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader
        variant="inner"
        title="Wishlist"
        left="back"
        backHref="/"
        right="cart"
      />
      <WishlistScreen />
    </main>
  );
}
