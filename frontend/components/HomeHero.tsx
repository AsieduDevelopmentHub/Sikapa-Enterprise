"use client";

import Image from "next/image";
import { HERO_PRODUCT_IMAGE } from "@/lib/assets";

export function HomeHero() {
  return (
    <section
      className="relative min-h-[min(58vh,460px)] overflow-hidden bg-[#7A1419]"
      aria-labelledby="hero-heading"
    >
      <div
        className="absolute inset-0 animate-hero-fade opacity-0"
        style={{
          background: "var(--sikapa-hero-gradient)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/50 via-black/18 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[22%] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-[#C8A96A]/55 to-transparent opacity-90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 100px rgba(0,0,0,0.38)" }}
      />

      <div className="relative z-[1] mx-auto flex min-h-[min(58vh,460px)] max-w-mobile items-stretch gap-2 px-4 pb-6 pt-9 sm:gap-3 sm:px-5 sm:pt-10">
        <div className="flex w-[min(32%,128px)] shrink-0 flex-col justify-center pr-0.5 opacity-0 animate-hero-text sm:w-[min(34%,140px)]">
          <h1
            id="hero-heading"
            className="font-serif font-semibold tracking-[0.02em] text-white"
          >
            <span className="block text-[2.75rem] leading-[1.05] sm:text-[2.125rem]">
              Luxury
            </span>
            <span className="block text-[2.75rem] leading-[1.05] sm:text-[2.125rem]">
              Beauty
            </span>
            <span className="block text-[2.75rem] font-medium leading-[1.1] tracking-[0.06em] text-sikapa-hero-subtext sm:text-[1.9rem]">
              For All
            </span>
          </h1>
        </div>

        <div className="relative flex min-h-[220px] min-w-0 flex-1 items-end justify-center pb-1 opacity-0 animate-hero-model sm:min-h-[268px]">
          <div className="relative h-[min(268px,44vh)] w-full max-w-[min(100%,288px)] sm:h-[min(300px,48vh)]">
            <Image
              src={HERO_PRODUCT_IMAGE}
              alt=""
              fill
              unoptimized
              className="object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
              sizes="(max-width:430px) 72vw, 288px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
