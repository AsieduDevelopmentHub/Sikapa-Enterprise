import { ScreenHeader } from "@/components/ScreenHeader";
import { CategorySection } from "@/components/CategorySection";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { HomeHero } from "@/components/HomeHero";

/** Home: hero → tagline → categories → featured (horizontal scroll). */
export default function HomePage() {
  return (
    <main className="bg-sikapa-cream">
      <ScreenHeader variant="home" />
      <HomeHero />
      <section
        className="border-y border-sikapa-gray-soft bg-sikapa-cream px-5 py-6 text-center"
        aria-label="Brand tagline"
      >
        <p className="font-serif text-[1.125rem] font-semibold leading-snug tracking-tight text-sikapa-text-primary sm:text-[1.2rem]">
          Shop High-End Beauty & Lifestyle
        </p>
      </section>
      <CategorySection />
      <FeaturedProducts />
    </main>
  );
}
