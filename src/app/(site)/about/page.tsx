import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Chaes Food, LLC — Philadelphia distributor of fresh, frozen, and dry foods for restaurants and foodservice.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Chaes Food, LLC</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">About us</h1>
      <div className="mt-8 space-y-4 text-muted">
        <p className="text-base leading-relaxed text-foreground/90">
          Chaes Food, LLC is a Philadelphia-based food distributor serving the greater Philadelphia area with fresh,
          frozen, and dry products. We work with restaurants, institutions, and foodservice operators who need reliable
          supply and straight answers from people who know the business.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          Our warehouse is located at{" "}
          <strong className="text-foreground">2100 N. American Street, Philadelphia, PA 19122</strong>, between Girard
          and Lehigh Avenues in North Philadelphia.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          For product questions, pricing, or directions to our dock, please{" "}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            contact our office
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
