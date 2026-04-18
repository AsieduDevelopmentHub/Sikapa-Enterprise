import { redirect } from "next/navigation";

export const metadata = { title: "Wishlist · Sikapa Enterprise" };

export default function AccountWishlistPage() {
  redirect("/shop");
}
