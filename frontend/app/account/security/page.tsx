import { AccountScreen } from "@/components/account/AccountScreen";
import { ScreenHeader } from "@/components/ScreenHeader";

export const metadata = { title: "Security · Sikapa Enterprise" };

export default function AccountSecurityPage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Security" left="back" backHref="/account" right="none" />
      <AccountScreen initialPanel="security" />
    </main>
  );
}
