import { AccountScreen } from "@/components/account/AccountScreen";
import { ScreenHeader } from "@/components/ScreenHeader";

export const metadata = { title: "Addresses · Sikapa Enterprise" };

export default function AccountAddressesPage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Addresses" left="back" backHref="/account" right="none" />
      <AccountScreen initialPanel="address" />
    </main>
  );
}
