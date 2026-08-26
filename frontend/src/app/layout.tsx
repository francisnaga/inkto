import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { AuthProvider } from "@/contexts/auth-context";
import { ServiceWorkerRegister } from "@/components/sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inkto — Legal Document Transcription",
  description: "Convert handwritten and scanned legal documents to editable text in seconds.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`} style={{ background: '#F5F5F0', minHeight: '100vh', margin: 0, padding: 0, fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <AuthProvider>
          {/* Phone-width container */}
          <div style={{
            margin: '0 auto',
            maxWidth: 448,
            minHeight: '100vh',
            background: '#FAFAF9',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)',
          }}>
            <main style={{ flex: 1, overflowY: 'auto', padding: '0 20px', WebkitOverflowScrolling: 'touch' }}>
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
