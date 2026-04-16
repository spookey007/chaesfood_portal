import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Chaes Food, LLC — phone, email, and map. 2100 N. American Street, Philadelphia, PA 19122.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Contact</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Contact us</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Reach Chaes Food for orders, product availability, or directions to our Philadelphia location.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-foreground">Chaes Food, LLC</h2>
          <address className="mt-4 not-italic text-base leading-relaxed text-muted">
            2100 N. American Street
            <br />
            Philadelphia, PA 19122
          </address>
          <ul className="mt-6 space-y-3 text-base">
            <li>
              <a href="tel:2154259999" className="font-semibold text-primary hover:underline">
                215-425-9999
              </a>
            </li>
            <li>
              <a href="mailto:admin@chaesfood.com" className="font-semibold text-primary hover:underline">
                admin@chaesfood.com
              </a>
            </li>
          </ul>
        </div>
        <div className="min-h-[280px] overflow-hidden rounded-2xl border border-black/5 bg-surface-muted shadow-sm">
          <iframe
            title="Chaes Food on Google Maps"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3057.113310078848!2d-75.14072588453563!3d39.98357307941787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c6c81122448627%3A0xe2d869053ff130ea!2sChaes%20Food!5e0!3m2!1sen!2sus!4v1608071852553!5m2!1sen!2sus"
            width="100%"
            height="100%"
            className="min-h-[280px] w-full border-0 lg:min-h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
