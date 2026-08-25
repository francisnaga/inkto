import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { AuthProvider } from "@/contexts/auth-context";
import { ServiceWorkerRegister } from "@/components/sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inkto — Legal Document Transcription",
  description: "Convert handwritten and scanned legal documents to editable Word in seconds.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-muted/30`}
      >
        <AuthProvider>
          <div className="mx-auto max-w-md min-h-screen bg-background relative flex flex-col shadow-sm border-x border-border/50">
            <main className="flex-1 pb-20 px-4 overflow-y-auto">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
