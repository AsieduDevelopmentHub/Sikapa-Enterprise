import { AccountScreen } from "@/components/account/AccountScreen";
import { ScreenHeader } from "@/components/ScreenHeader";

export const metadata = { title: "Profile · Sikapa Enterprise" };

export default function AccountProfilePage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Profile" left="back" backHref="/account" right="none" />
      <AccountScreen initialPanel="settings" />
    </main>
  );
}
