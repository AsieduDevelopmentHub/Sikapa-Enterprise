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
      <div className="px-5 py-10 text-body text-sikapa-text-secondary">
        <p className="font-serif text-section-title font-semibold text-sikapa-text-primary">
          Welcome to Sikapa
        </p>
        <p className="mt-3 leading-relaxed">
          Sign-in, profile, and addresses will connect to your backend next. Browse the shop and
          build your cart in the meantime.
        </p>
      </div>
    </main>
  );
}
