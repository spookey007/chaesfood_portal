import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from the Chaes Food product line — fresh, frozen, and dry foods.",
};

const galleryItems: { src: string; alt: string }[] = [
  { src: "/product_images/fresh/chicken.jpg", alt: "Fresh poultry" },
  { src: "/product_images/fresh/pork.jpg", alt: "Fresh pork" },
  { src: "/product_images/fresh/beef.jpg", alt: "Fresh beef" },
  { src: "/product_images/fresh/egg.jpg", alt: "Eggs and dairy" },
  { src: "/product_images/fresh/cheese.jpg", alt: "Cheese" },
  { src: "/product_images/fresh/bacon.jpg", alt: "Bacon and deli" },
  { src: "/product_images/frozen/fries.jpg", alt: "Frozen fries" },
  { src: "/product_images/frozen/phillysteak.jpg", alt: "Frozen Philly steak" },
  { src: "/product_images/frozen/burger.jpg", alt: "Frozen burgers" },
  { src: "/product_images/frozen/appetizers.jpg", alt: "Frozen appetizers" },
  { src: "/product_images/dry/sauce.jpg", alt: "Sauces" },
  { src: "/product_images/dry/oil.jpg", alt: "Oils" },
  { src: "/product_images/dry/flour.jpg", alt: "Flour and dry staples" },
  { src: "/product_images/dry/dry.jpg", alt: "Dry goods" },
  { src: "/product_images/dry/liquid.jpg", alt: "Beverages and liquids" },
];

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Gallery</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Product gallery</h1>
      <p className="mt-3 max-w-2xl text-muted">
        A selection of the fresh, frozen, and dry lines we move through our Philadelphia warehouse.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {galleryItems.map((item) => (
          <figure key={item.src} className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
            <div className="relative w-full pb-[100%]">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            </div>
            <figcaption className="px-2 py-2 text-center text-xs font-medium text-muted">{item.alt}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
