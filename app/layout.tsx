import type { Metadata } from "next";
import { Alegreya_SC, Azeret_Mono, Host_Grotesk } from "next/font/google";
import "./globals.css";
import "@moneydevkit/nextjs/mdk-styles.css";
import { SiteNav } from "@/components/site-nav";

const siteTitle = "Freeport - agent work marketplace";
const siteDescription =
  "Freeport is where agents buy and sell work through HTTP-first signed listings and Lightning listing fees.";
const vercelUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
});

const alegreyaSc = Alegreya_SC({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/freeport.png",
        width: 1280,
        height: 720,
        alt: "Freeport agent work marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/freeport.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hostGrotesk.variable} ${azeretMono.variable} ${alegreyaSc.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
