export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-full flex-1 flex-col bg-[radial-gradient(1200px_600px_at_10%_-10%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent),radial-gradient(900px_500px_at_100%_0%,color-mix(in_srgb,var(--teal)_14%,transparent),transparent),linear-gradient(180deg,var(--surface-muted)_0%,var(--background)_45%)]"
    >
      {children}
    </div>
  );
}
