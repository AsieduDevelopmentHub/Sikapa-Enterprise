import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Privacy Policy" left="back" backHref="/" right="none" />
      <article className="mx-auto max-w-mobile space-y-4 px-5 py-8 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-400">
        <p className="font-medium text-sikapa-text-primary dark:text-zinc-200">
          Last updated: {new Date().getFullYear()}
        </p>
        <p>
          This is placeholder content describing how Sikapa Enterprise handles personal data. Replace it with a complete
          privacy policy appropriate for your jurisdiction.
        </p>
        <p>
          Override this page with an external URL using{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 text-[11px] dark:bg-white/10">NEXT_PUBLIC_PRIVACY_URL</code>.
        </p>
        <p>
          <Link href="/" className="font-semibold text-sikapa-gold underline-offset-2 hover:underline">
            Back to home
          </Link>
        </p>
      </article>
    </main>
  );
}
