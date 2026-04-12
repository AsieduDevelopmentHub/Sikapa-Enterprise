import Link from "next/link";

export function HomeHelpCta() {
  return (
    <section className="bg-white px-4 py-6" aria-labelledby="help-heading">
      <div className="mx-auto max-w-mobile">
        <div className="rounded-[10px] bg-gradient-to-br from-sikapa-crimson to-[#5c1f24] px-5 py-5 text-center shadow-md ring-1 ring-black/10">
          <h2 id="help-heading" className="font-serif text-section-title font-semibold text-white">
            Need a hand?
          </h2>
          <p className="mt-2 text-small leading-relaxed text-white/85">
            Orders, account settings, and more — your hub is one tap away.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/account"
              className="sikapa-tap inline-flex items-center justify-center rounded-[10px] bg-sikapa-gold px-5 py-2.5 text-small font-semibold text-white shadow-sm"
            >
              Account & help
            </Link>
            <Link
              href="/orders"
              className="sikapa-tap inline-flex items-center justify-center rounded-[10px] border border-white/40 bg-white/10 px-5 py-2.5 text-small font-semibold text-white backdrop-blur-sm"
            >
              Track orders
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
