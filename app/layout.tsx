import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "EVENTOPS — Run the event, not the paperwork.",
  description:
    "Universal AI-powered Event Operations & Management SaaS platform built by Panch Pandavs. Enterprise registration, QR check-in, intelligent OR-Tools allocation, live control center, digital rubrics, and real-time operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">EVENTOPS ENGINE LOADING...</div>}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
