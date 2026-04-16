import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

const quickLinks = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/employment", label: "Employment" },
  { href: "/daily-specials", label: "Daily specials" },
  { href: "/cart", label: "Cart" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/[0.08] bg-footer-bg text-footer-muted">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 120% 80% at 50% -20%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 28%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-3">
              <span className="h-1 w-10 rounded-full bg-primary shadow-[0_0_20px_rgba(16,134,255,0.55)]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/55">Est. Philadelphia</p>
            </div>
            <p className="font-heading mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Chaes Food, LLC
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-footer-muted sm:text-[15px]">
              Philadelphia&apos;s distributor of fresh, frozen, and dry foods — produce, poultry, pork, beef, deli and
              dairy, and frozen goods for restaurants and foodservice across the greater Philadelphia area.
            </p>
            <a
              href="tel:2154259999"
              className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-white shadow-[0_12px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm transition hover:border-primary/35 hover:bg-primary/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Phone className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/50">Call us</span>
                <span className="text-lg font-bold tracking-tight">215-425-9999</span>
              </span>
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4 lg:gap-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Explore</p>
              <ul className="mt-5 space-y-3">
                {quickLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-[15px] font-semibold text-white/80 underline-offset-4 transition hover:text-white hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Visit</p>
              <ul className="mt-5 space-y-5 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary/90" strokeWidth={1.75} aria-hidden />
                  <span className="leading-relaxed text-white/75">
                    2100 N. American Street
                    <br />
                    Philadelphia, PA 19122
                  </span>
                </li>
                <li>
                  <a
                    href="mailto:admin@chaesfood.com"
                    className="inline-flex items-center gap-2 font-semibold text-white/85 transition hover:text-primary"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-primary/80" strokeWidth={1.75} aria-hidden />
                    admin@chaesfood.com
                  </a>
                </li>
              </ul>
              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Staff</p>
              <Link
                href="/login?callbackUrl=/admin"
                className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/90 transition hover:border-primary/40 hover:text-primary"
              >
                Staff login
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 sm:p-7 lg:col-span-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Connect</p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Follow Chaes Food for updates and specials.
              </p>
            </div>
            <a
              href="https://www.facebook.com/chaesfood/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-[0_14px_40px_-12px_rgba(16,134,255,0.65)] transition hover:bg-[color:var(--primary-hover)]"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/[0.06] bg-black/25">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-xs text-white/45 sm:text-left">
            © {new Date().getFullYear()} Chaes Food, LLC. All rights reserved.
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">Philadelphia food distributor</p>
        </div>
      </div>
    </footer>
  );
}
