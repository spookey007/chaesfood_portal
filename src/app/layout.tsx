import type { Metadata, Viewport } from "next";
import { Mulish, Roboto } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
  weight: ["600", "700", "800"],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000"),
  applicationName: "ChaesFood",
  title: {
    default: "Chaes Food LLC | Philadelphia Fresh Food Distributor",
    template: "%s · Chaes Food LLC",
  },
  description:
    "Chaes Food LLC is Philadelphia's distributor of fresh, frozen, and dry foods — produce, poultry, pork, beef, deli and dairy, and frozen goods for foodservice.",
  appleWebApp: {
    capable: true,
    title: "ChaesFood",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1086ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full scroll-smooth ${mulish.variable} ${roboto.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="ChaesFood" />
      </head>
      <body className="flex min-h-[100dvh] flex-col overflow-x-clip font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
