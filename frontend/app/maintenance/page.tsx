import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Down for maintenance — Sikapa",
  description: "Sikapa is undergoing scheduled maintenance. Please check back shortly.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-sikapa-cream px-6 text-center dark:bg-zinc-950">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sikapa-text-muted dark:text-zinc-500">
        Status 503
      </p>
      <h1 className="font-serif text-page-title text-sikapa-text-primary dark:text-zinc-100">
        We&apos;ll be right back
      </h1>
      <p className="max-w-md text-body text-sikapa-text-secondary dark:text-zinc-400">
        Sikapa is undergoing scheduled maintenance. Browsing, sign-in, and
        checkout will return as soon as we&apos;re done. Thank you for your
        patience.
      </p>
    </main>
  );
}
