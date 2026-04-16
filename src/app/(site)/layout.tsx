import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteStorefrontProviders } from "@/components/providers/site-storefront-providers";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteStorefrontProviders>
      <div className="flex min-h-[100dvh] flex-col bg-[#f8f9fb] pb-[env(safe-area-inset-bottom,0px)]">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </div>
    </SiteStorefrontProviders>
  );
}
