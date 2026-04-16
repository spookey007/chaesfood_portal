import Link from "next/link";
import { HomeHeroCarousel, type HeroSlide } from "@/components/marketing/home-hero-carousel";
import { PartnersMarquee } from "@/components/marketing/partners-marquee";

const heroSlides: HeroSlide[] = [
  { src: "/brand/ppt-hero.jpg", alt: "Chaes Food — foodservice distribution" },
  { src: "/product_images/fresh/chicken.jpg", alt: "Fresh poultry for Philadelphia restaurants" },
  { src: "/product_images/frozen/fries.jpg", alt: "Frozen foods for foodservice" },
  { src: "/product_images/dry/sauce.jpg", alt: "Dry goods and sauces" },
];

export default function HomePage() {
  return (
    <main>
      <HomeHeroCarousel slides={heroSlides} />

      <section
        className="border-b border-black/5 bg-white"
        aria-labelledby="partners-heading"
      >
        <div
          className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20"
          style={{
            backgroundImage:
              "linear-gradient(165deg, color-mix(in srgb, var(--primary) 8%, white) 0%, white 42%, color-mix(in srgb, var(--primary) 4%, white) 100%)",
          }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/90">Partners</p>
            <h2
              id="partners-heading"
              className="font-heading mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl"
            >
              Trusted across the Philadelphia area
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              A snapshot of the restaurants, institutions, and foodservice teams we support every day.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white/80 py-1 shadow-sm backdrop-blur-sm">
            <PartnersMarquee />
          </div>
        </div>
      </section>

      <section
        className="border-b border-black/10 bg-cover bg-center bg-no-repeat py-16 text-center sm:py-24 md:py-28"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(12,19,40,0.82), rgba(12,19,40,0.88)), url(/brand/ppt-hero.jpg)",
        }}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
            We know every penny counts in business
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/95 sm:text-xl md:text-2xl">
            We strive to simplify in all that we do. We make business easy so our customers can save money.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="font-heading text-center text-2xl font-extrabold text-foreground sm:text-3xl">Why Chaes Food</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted sm:text-base">
          Based in North Philadelphia, we supply fresh, frozen, and dry products to the greater Philadelphia area.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Save time & money",
              body: "Since 1996, Chaes Food has worked to save customers time and money on the products they rely on.",
            },
            {
              title: "Locally rooted",
              body: "Located on North American Street between Girard and Lehigh Avenues in Philadelphia, PA 19122.",
            },
            {
              title: "Market-smart buying",
              body: "Our team follows national food markets and trends, adjusting to help you stay competitive.",
            },
            {
              title: "Service you can count on",
              body: "Customers know they can speak with our sales and warehouse team for straight answers and support.",
            },
          ].map((item) => (
            <li key={item.title} className="rounded-2xl border border-black/5 bg-white p-6 text-left shadow-sm">
              <div className="h-1 w-10 rounded-full bg-primary" />
              <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/products"
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-md transition hover:bg-[color:var(--primary-hover)] sm:w-auto"
          >
            View products
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full border-2 border-primary bg-white px-8 py-3.5 text-base font-bold text-primary transition hover:bg-primary/5 sm:w-auto"
          >
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
