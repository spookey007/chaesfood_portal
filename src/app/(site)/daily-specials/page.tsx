import type { Metadata } from "next";
import Link from "next/link";
import { FileDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Daily specials",
  description: "Current daily specials flyer at Chaes Food, LLC — Philadelphia foodservice.",
};

const PDF_HREF = "/daily-specials-ad.pdf";

export default function DailySpecialsPage() {
  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,#fff)_0%,#fff_28%)]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Daily specials</p>
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]">
            Current flyer
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Special buys and closeout pricing change often. View the flyer below, call the office for today&apos;s list,
            or visit{" "}
            <strong className="text-foreground">2100 N. American Street, Philadelphia, PA 19122</strong> during
            business hours.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="tel:2154259999"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-primary px-10 text-base font-bold text-primary-foreground shadow-md transition hover:bg-[color:var(--primary-hover)]"
            >
              Call 215-425-9999
            </a>
            <a
              href={PDF_HREF}
              download
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-2 border-primary/25 bg-white px-8 text-base font-bold text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <FileDown className="h-5 w-5 shrink-0" aria-hidden />
              Download PDF
            </a>
            <Link
              href="/contact"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full px-6 text-base font-semibold text-muted underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Contact form
            </Link>
          </div>
        </div>

        <section className="mt-12" aria-labelledby="flyer-heading">
          <h2 id="flyer-heading" className="sr-only">
            Daily specials PDF
          </h2>
          <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-elevated">
            <iframe
              title="Daily specials flyer (PDF)"
              src={`${PDF_HREF}#view=FitH`}
              className="block h-[min(78vh,920px)] w-full bg-[#f4f6f8]"
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Trouble viewing the flyer? Use{" "}
            <a href={PDF_HREF} download className="font-semibold text-primary hover:underline">
              download PDF
            </a>{" "}
            or call us — we&apos;re happy to read specials over the phone.
          </p>
        </section>
      </div>
    </main>
  );
}
