"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  src: string;
  alt: string;
};

const AUTO_MS = 7000;

export function HomeHeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const len = slides.length;
  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + len) % len);
    },
    [len],
  );

  useEffect(() => {
    if (len <= 1 || paused || reducedMotion) return;
    const t = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(t);
  }, [len, paused, reducedMotion, go]);

  return (
    <section
      className="relative border-b border-black/10 bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto w-full max-w-[1920px]">
        {/* Padding-bottom reserves height for absolutely positioned slides + Next/Image fill */}
        <div className="relative w-full">
          <div className="block w-full pb-[125%] sm:pb-[56.25%] md:pb-[42.55%]" aria-hidden />
          <div className="absolute inset-0">
          {slides.map((slide, i) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === index ? "z-[1] opacity-100" : "z-0 opacity-0"
              }`}
              aria-hidden={i !== index}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 z-[2] px-4 pb-10 pt-24 sm:px-8 sm:pb-12 md:px-12 md:pb-14">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/90 sm:text-sm">Chaes Food, LLC</p>
                <h2 className="mt-2 max-w-3xl font-heading text-2xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                  Honest business made easy
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Philadelphia distributor of fresh, frozen, and dry foods for restaurants and foodservice.
                </p>
              </div>
            </div>
          ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 z-[3] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/55 sm:left-4 md:h-12 md:w-12"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 z-[3] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/55 sm:right-4 md:h-12 md:w-12"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>

        <div className="absolute bottom-4 left-0 right-0 z-[3] flex justify-center gap-2 sm:bottom-5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
