import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/mock-data";

/** Mockup home: only Best Sellers + Wigs in the first grid. */
const HOME_KEYS = new Set(["bestsellers", "wigs"]);

export function CategorySection() {
  const homeCats = CATEGORIES.filter((c) => HOME_KEYS.has(c.key));

  return (
    <section
      id="categories"
      className="scroll-mt-20 bg-sikapa-cream px-4 pb-8 pt-5"
      aria-label="Categories"
    >
      <div className="grid grid-cols-2 gap-4">
        {homeCats.map((cat) => (
          <article
            key={cat.key}
            className="overflow-hidden rounded-[10px] bg-white shadow-[0_2px_16px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.04]"
          >
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={cat.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width:430px) 46vw, 200px"
              />
            </div>
            <div className="space-y-3 px-3 pb-4 pt-3">
              <h2 className="text-center font-serif text-[1.05rem] font-semibold text-sikapa-text-primary">
                {cat.label}
              </h2>
              <Link
                href={`/shop?cat=${cat.slug}`}
                className="sikapa-btn-gold sikapa-tap flex w-full items-center justify-center rounded-[10px] py-3 text-small font-semibold text-white"
              >
                Shop Now
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 text-center text-small text-sikapa-text-secondary">
        <Link href="/shop" className="font-medium text-sikapa-crimson underline-offset-2 hover:underline">
          Skincare, perfumes & more
        </Link>
      </p>
    </section>
  );
}
