import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { FetchInterceptor } from "@/components/fetch-interceptor";
import { BackButtonHandler } from "@/components/back-button-handler";
import { AppLayout } from "@/components/app-layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins" 
});

export const metadata: Metadata = {
  title: "Inkto — Capture. Transcribe. Intelligent.",
  description: "Convert handwritten notes, printed documents, audio files, and real-time voice recording into accurate, searchable text.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased m-0 p-0 overflow-hidden">
        <BackButtonHandler />
        <FetchInterceptor />
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
