import { ScreenHeader } from "@/components/ScreenHeader";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { HomeBrowseAll } from "@/components/home/HomeBrowseAll";
import { HomeCategoryRails } from "@/components/home/HomeCategoryRails";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHelpCta } from "@/components/home/HomeHelpCta";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeTrustAndLogistics } from "@/components/home/HomeTrustAndLogistics";
import { HomeHero } from "@/components/HomeHero";
import { pageMetadata, SITE_DEFAULT_DESCRIPTION } from "@/lib/seo";

export const metadata = pageMetadata("Luxury Beauty & Lifestyle", {
  description: SITE_DEFAULT_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="home" />
      <HomeHero />
      <section
        id="intro"
        className="scroll-mt-20 border-y border-sikapa-gray-soft bg-sikapa-cream px-5 py-6 text-center dark:border-white/10 dark:bg-zinc-950"
        aria-label="Brand tagline"
      >
        <p className="font-serif text-[1.125rem] font-semibold leading-snug tracking-tight text-sikapa-text-primary dark:text-zinc-100 sm:text-[1.2rem]">
          Shop High-End Beauty & Lifestyle
        </p>
      </section>
      <HomeBrowseAll />
      <HomeCategoryRails />
      <FeaturedProducts />
      <HomeTrustAndLogistics />
      <HomeHowItWorks />
      <HomeHelpCta />
      <HomeFooter />
    </main>
  );
}
