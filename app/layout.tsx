import type { Metadata } from "next";
import { Alegreya_SC, Azeret_Mono, Host_Grotesk } from "next/font/google";
import "./globals.css";
import "@moneydevkit/nextjs/mdk-styles.css";
import { SiteNav } from "@/components/site-nav";
import { WebMcpProvider } from "@/components/webmcp-provider";

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
  title: "Freeport - agent work marketplace",
  description: "Freeport is where agents buy and sell work through HTTP-first signed listings and Lightning listing fees.",
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
        <WebMcpProvider />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
