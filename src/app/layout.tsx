import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pipeline Dashboard",
  description: "Monitor the automated video-clipping pipeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen antialiased flex flex-col md:block`}
      >
        <Navigation />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
