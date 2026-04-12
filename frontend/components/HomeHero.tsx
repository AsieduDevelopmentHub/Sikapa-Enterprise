"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Warm, editorial portrait — skin tones align with crimson / deep-wine hero gradient.
 * Unsplash: replace URL if you host your own shoot.
 */
const HERO_MODEL_SRC =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&h=1200&fit=crop&q=85";

export function HomeHero() {
  return (
    <section
      className="relative min-h-[min(62vh,500px)] overflow-hidden"
      style={{ background: "var(--sikapa-hero-gradient)" }}
      aria-labelledby="hero-heading"
    >
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

      <div className="relative z-[1] mx-auto flex min-h-[min(62vh,500px)] max-w-mobile flex-col px-4 pb-8 pt-9 sm:px-5 sm:pt-10">
        <div className="flex min-h-0 flex-1 items-center">
          <div className="flex max-w-[min(54%,240px)] shrink-0 flex-col pr-2 sm:max-w-[250px]">
            <div className="opacity-0 animate-hero-text">
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

            <div
              className="mt-4 h-px w-14 bg-gradient-to-r from-sikapa-gold/90 via-sikapa-gold to-transparent opacity-0 animate-hero-text sm:w-16"
              style={{ animationDelay: "0.28s" }}
              aria-hidden
            />

            <p
              className="mt-3 font-sans text-[0.8125rem] leading-relaxed text-sikapa-hero-subtext opacity-0 animate-hero-text sm:text-[0.875rem]"
              style={{ animationDelay: "0.4s" }}
            >
              Premium cosmetics, wigs, and skincare — for every skin and every style.
            </p>

            <p
              className="mt-2.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.22em] text-white/55 opacity-0 animate-hero-text sm:text-[0.6875rem]"
              style={{ animationDelay: "0.52s" }}
            >
              Wigs · Skincare · Perfumes · Care
            </p>

            <div className="opacity-0 animate-hero-text" style={{ animationDelay: "0.62s" }}>
              <Link
                href="/shop"
                className="sikapa-btn-gold sikapa-tap mt-5 inline-flex items-center justify-center rounded-[10px] px-6 py-3 text-small font-semibold text-white shadow-lg shadow-black/20"
              >
                Shop Now
              </Link>
            </div>
          </div>

          <div className="min-w-0 flex-1" aria-hidden />
        </div>

        <div
          className="pointer-events-none flex justify-center pb-1 pt-2 opacity-0 animate-hero-text"
          style={{ animationDelay: "0.85s" }}
          aria-hidden
        >
          <span className="inline-flex flex-col items-center gap-0.5 text-[0.625rem] font-medium uppercase tracking-[0.28em] text-white/40">
            <span>Explore</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="animate-bounce text-sikapa-gold/70"
              aria-hidden
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
