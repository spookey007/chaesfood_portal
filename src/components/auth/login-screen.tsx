"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const demoEmail = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL ?? "";
const demoPassword = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? "";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const registered = searchParams.get("registered") === "1";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (res?.error) {
      setError(
        "Invalid email or password. If you pointed DATABASE_URL at a new database, run npm run db:seed first, or enable ALLOW_ENV_DEMO_LOGIN with matching ADMIN_* / DEMO_* in .env.",
      );
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  function fillDemo() {
    if (!demoEmail || !demoPassword) return;
    const form = document.getElementById("login-form") as HTMLFormElement | null;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = demoEmail;
    (form.elements.namedItem("password") as HTMLInputElement).value = demoPassword;
  }

  return (
    <div className="grid min-h-[100dvh] w-full lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="relative hidden min-h-[320px] lg:block">
        <Image
          src="/brand/ppt-hero.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="50vw"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--primary) 72%, transparent) 0%, color-mix(in srgb, var(--teal) 55%, #0a0a0a) 100%)",
          }}
        />
        <motion.div
          className="absolute inset-0 flex flex-col justify-end p-12 text-white"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease, delay: 0.08 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
            Chae&apos;s Food LLC
          </p>
          <p className="mt-5 max-w-sm text-xs leading-relaxed text-white/75">
            Sign in to manage orders, products, and accounts. Demo credentials can be filled
            automatically when configured.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col justify-center px-4 py-8 sm:px-10 sm:py-12 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-black/5 shadow-lg">
              <Image
                src="/brand/ppt-hero.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--primary) 55%, transparent), color-mix(in srgb, var(--teal) 50%, transparent))",
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 to-transparent p-4 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/75">
                  Chae&apos;s Food LLC
                </p>
                <p className="mt-1 text-sm font-bold leading-snug">
                  Why Chae&apos;s Food Needs a Client Portal
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/95 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff sign in</h1>
                <p className="mt-2 text-sm text-muted">Administrator access for the store console.</p>
              </div>
              <span className="relative block h-11 w-[100px] shrink-0 overflow-hidden rounded-xl  shadow-md">
                <Image src="/logo.png" alt="Chae's Food" fill className="object-contain p-1" sizes="100px" />
              </span>
            </div>

            {registered ? (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 overflow-hidden rounded-xl bg-chart-positive/12 px-3 py-2 text-sm font-medium text-foreground"
              >
                Account created. You can sign in below.
              </motion.p>
            ) : null}

            <form id="login-form" className="mt-8 space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-base text-foreground outline-none ring-ring/30 transition focus:ring-4 sm:min-h-0 sm:py-2.5 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-base text-foreground outline-none ring-ring/30 transition focus:ring-4 sm:min-h-0 sm:py-2.5 sm:text-sm"
                />
              </div>
              {demoEmail && demoPassword ? (
                <button
                  type="button"
                  onClick={fillDemo}
                  className="min-h-[48px] w-full rounded-xl border border-dashed border-primary/35 bg-primary/5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 sm:min-h-0 sm:py-2.5"
                >
                  Use demo credentials
                </button>
              ) : null}
              {error ? (
                <p className="text-sm font-medium text-chart-alert" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="min-h-[52px] w-full touch-manipulation rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-[0_14px_40px_-14px_rgba(66,133,244,0.75)] transition hover:opacity-95 disabled:opacity-60 sm:min-h-0 sm:text-sm"
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Shopping the catalog?{" "}
              <Link href="/products" className="font-semibold text-primary hover:underline">
                Browse products
              </Link>{" "}
              — no account required.
            </p>
            <p className="mt-4 text-center text-xs text-muted">
              Need an admin login?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Learn how access works
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function LoginScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center p-8">
          <div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-white/40" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
