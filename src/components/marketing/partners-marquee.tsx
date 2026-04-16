"use client";

import Image from "next/image";

const LOGO_PATHS = Array.from({ length: 9 }, (_, i) => `/client-pic/client-${i + 1}.png`);

export function PartnersMarquee() {
  return (
    <div className="partners-marquee-wrap relative overflow-hidden py-6 md:py-8">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16 bg-gradient-to-r from-white to-transparent md:w-24"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-16 bg-gradient-to-l from-white to-transparent md:w-24"
        aria-hidden
      />
      <div className="partners-marquee-track flex w-max animate-partners-marquee will-change-transform">
        {[0, 1].map((dup) => (
          <div
            key={dup}
            className="flex shrink-0 items-center justify-center gap-10 px-5 md:gap-14 md:px-8"
            aria-hidden={dup === 1}
          >
            {LOGO_PATHS.map((src) => (
              <div
                key={`${dup}-${src}`}
                className="relative h-12 w-[7.5rem] opacity-[0.72] grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-14 sm:w-36 md:h-16 md:w-40"
              >
                <Image src={src} alt="" fill sizes="160px" className="object-contain" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
