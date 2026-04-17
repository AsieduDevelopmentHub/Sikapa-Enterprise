import { AccountScreen } from "@/components/account/AccountScreen";
import { ScreenHeader } from "@/components/ScreenHeader";

export const metadata = { title: "Notifications · Sikapa Enterprise" };

export default function AccountNotificationsPage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Notifications" left="back" backHref="/account" right="none" />
      <AccountScreen initialPanel="notifications" />
    </main>
  );
}
