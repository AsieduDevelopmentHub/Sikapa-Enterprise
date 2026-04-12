import Link from "next/link";

const primary = [
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "Account" },
] as const;

const onPage = [
  { href: "/#categories", label: "Categories" },
  { href: "/#featured", label: "Featured" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#trust", label: "Why Sikapa" },
] as const;

export function HomeFooter() {
  return (
    <footer className="border-t border-sikapa-gray-soft bg-[#2a2422] px-4 py-8 text-sikapa-gray-soft">
      <div className="mx-auto max-w-mobile">
        <p className="font-serif text-small font-semibold tracking-[0.12em] text-white">SIKAPA</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/60">
          Luxury beauty for all — cosmetics, wigs, skincare, and fragrance.
        </p>

        <nav className="mt-6" aria-label="Footer">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-gold/90">Navigate</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            {primary.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-small text-white/80 hover:text-sikapa-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-sikapa-gold/90">
            On this page
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            {onPage.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-small text-white/70 hover:text-sikapa-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8 border-t border-white/10 pt-6 text-center text-[10px] text-white/45">
          © {new Date().getFullYear()} Sikapa Enterprise. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
