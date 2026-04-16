import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white/95 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff accounts</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This store is open to everyone: browse products and check out as a guest. Accounts here are
          for administrators only — to manage orders, catalog, and settings.
        </p>
        <p className="mt-4 text-sm text-muted">
          Need an admin login? Ask your Chae&apos;s Food administrator to create one.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
          >
            Browse products
          </Link>
          <Link
            href="/login?callbackUrl=/admin"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-95"
          >
            Admin sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
