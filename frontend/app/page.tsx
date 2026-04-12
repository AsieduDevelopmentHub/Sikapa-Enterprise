import { ScreenHeader } from "@/components/ScreenHeader";
import { CategorySection } from "@/components/CategorySection";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { HomeBrowseAll } from "@/components/home/HomeBrowseAll";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHelpCta } from "@/components/home/HomeHelpCta";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeTrustStrip } from "@/components/home/HomeTrustStrip";
import { HomeHero } from "@/components/HomeHero";

/** Home: hero → trust → categories → all collections → featured → how-to → help → footer. */
export default function HomePage() {
  return (
    <main className="bg-sikapa-cream">
      <ScreenHeader variant="home" />
      <HomeHero />
      <section
        id="intro"
        className="scroll-mt-20 border-y border-sikapa-gray-soft bg-sikapa-cream px-5 py-6 text-center"
        aria-label="Brand tagline"
      >
        <p className="font-serif text-[1.125rem] font-semibold leading-snug tracking-tight text-sikapa-text-primary sm:text-[1.2rem]">
          Shop High-End Beauty & Lifestyle
        </p>
      </section>
      <HomeTrustStrip />
      <CategorySection />
      <HomeBrowseAll />
      <FeaturedProducts />
      <HomeHowItWorks />
      <HomeHelpCta />
      <HomeFooter />
    </main>
  );
}
