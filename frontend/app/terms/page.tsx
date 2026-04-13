import Link from "next/link";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="Terms of Service" left="back" backHref="/" right="none" />
      <article className="mx-auto max-w-mobile space-y-4 px-5 py-8 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-400">
        <p className="font-medium text-sikapa-text-primary dark:text-zinc-200">
          Last updated: {new Date().getFullYear()}
        </p>
        <p>
          This is placeholder content for Sikapa Enterprise. Replace it with terms reviewed by your legal counsel before
          launch.
        </p>
        <p>
          You can point users to an external policy by setting{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 text-[11px] dark:bg-white/10">NEXT_PUBLIC_TERMS_URL</code> in
          your frontend environment.
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
