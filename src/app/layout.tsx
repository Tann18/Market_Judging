import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MarketProvider } from "@/context/MarketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Market Judging · Real-Time Financial Simulation Terminal",
  description: "Real-time stock market judging arena with live projector display, judge controls, and organizer dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#080d1a] text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-200"
        suppressHydrationWarning
      >
        <MarketProvider>{children}</MarketProvider>
      </body>
    </html>
  );
}
