import type { Metadata } from "next";
import { Azeret_Mono, Host_Grotesk } from "next/font/google";
import "./globals.css";
import "@moneydevkit/nextjs/mdk-styles.css";
import { SiteNav } from "@/components/site-nav";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
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
      className={`${hostGrotesk.variable} ${azeretMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
