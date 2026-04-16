import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Employment",
  description: "Careers at Chaes Food, LLC — Philadelphia food distributor.",
};

export default function EmploymentPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Employment</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Join our team</h1>
      <p className="mt-6 text-base leading-relaxed text-muted">
        Chaes Food hires warehouse, driver, and office roles as openings become available. We look for people who are
        dependable, safety-minded, and comfortable in a fast-paced food distribution environment.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        To ask about current openings or submit a résumé, call{" "}
        <a href="tel:2154259999" className="font-semibold text-primary hover:underline">
          215-425-9999
        </a>{" "}
        or email{" "}
        <a href="mailto:admin@chaesfood.com" className="font-semibold text-primary hover:underline">
          admin@chaesfood.com
        </a>
        .
      </p>
      <p className="mt-8">
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          Contact page with map →
        </Link>
      </p>
    </div>
  );
}
