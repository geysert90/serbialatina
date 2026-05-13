import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteShell } from "@/components/site-shell";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { PushNotificationsPrompt } from "@/components/push-notifications-prompt";
import { getSiteChromeData, getSiteIdentity } from "@/lib/wordpress";
import { getBaseSiteUrl } from "@/lib/utils";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteIdentity();

  return {
    metadataBase: new URL(getBaseSiteUrl()),
    title: {
      default: site.name,
      template: `%s | ${site.name}`,
    },
    description:
      site.description ||
      "Noticias, comunidad, trabajos, tienda y páginas servidas desde WordPress.",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/icon-192-white.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512-white.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title: site.name,
      description:
        site.description ||
        "Frontend dinámico de Serbia Latina conectado a WordPress.",
      type: "website",
      url: getBaseSiteUrl(),
      siteName: site.name,
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description:
        site.description ||
        "Frontend dinámico de Serbia Latina conectado a WordPress.",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f5efe2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chrome = await getSiteChromeData();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteShell chrome={chrome}>{children}</SiteShell>
        <PwaInstallPrompt />
        <PushNotificationsPrompt />
      </body>
    </html>
  );
}
