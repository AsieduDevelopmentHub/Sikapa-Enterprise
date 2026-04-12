import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/mock-data";

export function HomeBrowseAll() {
  return (
    <section
      id="browse-all"
      className="scroll-mt-20 bg-white px-4 py-6"
      aria-labelledby="browse-all-heading"
    >
      <div className="mx-auto max-w-mobile">
        <div className="mb-4 flex items-end justify-between gap-2">
          <div>
            <h2
              id="browse-all-heading"
              className="font-serif text-section-title font-semibold text-sikapa-text-primary sm:text-[1.125rem]"
            >
              All collections
            </h2>
            <p className="mt-1 text-small text-sikapa-text-secondary">
              Jump straight into what you need — every aisle in one scroll.
            </p>
          </div>
          <Link
            href="/shop"
            className="shrink-0 text-small font-semibold text-sikapa-crimson underline-offset-2 hover:underline"
          >
            Shop all
          </Link>
        </div>
        <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <li key={cat.key} className="w-[132px] shrink-0">
              <Link
                href={`/shop?cat=${cat.slug}`}
                className="sikapa-tap block overflow-hidden rounded-[10px] bg-sikapa-cream ring-1 ring-black/[0.06] transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={cat.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="132px"
                  />
                </div>
                <p className="px-2 py-2.5 text-center text-small font-semibold text-sikapa-text-primary">
                  {cat.label}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
