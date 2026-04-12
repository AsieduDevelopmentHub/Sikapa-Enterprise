"use client";

import Image from "next/image";

/**
 * Warm, editorial portrait — skin tones align with crimson / deep-wine hero gradient.
 * Unsplash: replace URL if you host your own shoot.
 */
const HERO_MODEL_SRC =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&h=1200&fit=crop&q=85";

export function HomeHero() {
  return (
    <section
      className="relative min-h-[min(58vh,460px)] overflow-hidden"
      style={{ background: "var(--sikapa-hero-gradient)" }}
      aria-labelledby="hero-heading"
    >
      {/* Gradient is on the section itself — no solid crimson fallback layer on top. */}
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

      {/* Model: right-weighted, feathered into gradient (no separate “flat crimson” strip). */}
      <div className="pointer-events-none absolute bottom-0 right-[-8%] top-[6%] z-0 w-[78%] max-w-[300px] opacity-0 animate-hero-model sm:right-[-4%] sm:max-w-[320px]">
        <div
          className="relative h-full w-full"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 38%, black 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 38%, black 100%)",
          }}
        >
          <Image
            src={HERO_MODEL_SRC}
            alt=""
            fill
            className="object-cover object-[center_12%]"
            sizes="(max-width:430px) 78vw, 320px"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#5c2520]/55 via-transparent to-transparent mix-blend-soft-light"
            aria-hidden
          />
        </div>
      </div>

      <div className="relative z-[1] mx-auto flex min-h-[min(58vh,460px)] max-w-mobile items-stretch px-4 pb-6 pt-9 sm:px-5 sm:pt-10">
        <div className="flex max-w-[min(46%,200px)] shrink-0 flex-col justify-center pr-2 opacity-0 animate-hero-text sm:max-w-[220px]">
          <h1
            id="hero-heading"
            className="font-serif font-semibold tracking-[0.02em] text-white"
          >
            <span className="block text-[1.95rem] leading-[1.06] sm:text-[2.2rem]">Luxury</span>
            <span className="mt-1.5 block text-[1.95rem] leading-[1.06] sm:text-[2.2rem]">
              Beauty
            </span>
            <span className="mt-2.5 block text-[1.3rem] font-medium leading-[1.15] tracking-[0.08em] text-sikapa-hero-subtext sm:text-[1.5rem]">
              For All
            </span>
          </h1>
        </div>
        {/* Spacer so headline clears the masked model on small screens */}
        <div className="min-w-0 flex-1" aria-hidden />
      </div>
    </section>
  );
}
