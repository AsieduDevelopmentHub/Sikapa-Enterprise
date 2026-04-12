import { AccountScreen } from "@/components/account/AccountScreen";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function AccountPage() {
  return (
    <main className="bg-sikapa-cream">
      <ScreenHeader
        variant="inner"
        title="Account"
        left="back"
        backHref="/"
        right="none"
      />
      <AccountScreen />
    </main>
  );
}
