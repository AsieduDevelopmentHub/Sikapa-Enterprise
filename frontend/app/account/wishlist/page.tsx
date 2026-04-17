import { ScreenHeader } from "@/components/ScreenHeader";
import { WishlistScreen } from "@/components/wishlist/WishlistScreen";

export const metadata = { title: "Wishlist · Sikapa Enterprise" };

export default function AccountWishlistPage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Wishlist" left="back" backHref="/account" right="cart" />
      <WishlistScreen />
    </main>
  );
}
