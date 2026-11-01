import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { FetchInterceptor } from "@/components/fetch-interceptor";

export const metadata: Metadata = {
  metadataBase: new URL("https://inkto.jointaccount.org"),
  title: "Inkto — Legal Document Transcription",
  description: "Convert handwritten and scanned legal documents to editable text in seconds.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/inkto-app-icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/inkto-app-icon-512x512.png", sizes: "512x512" },
    ],
  },
  openGraph: {
    title: "Inkto — Legal Document Transcription",
    description: "Convert handwritten and scanned legal documents to editable text in seconds.",
    url: "https://inkto.jointaccount.org",
    siteName: "Inkto",
    images: [
      {
        url: "/inkto-feature-graphic-1024x500.png",
        width: 1024,
        height: 500,
        alt: "Inkto Legal Document Transcription",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkto — Legal Document Transcription",
    description: "Convert handwritten and scanned legal documents to editable text in seconds.",
    images: ["/inkto-feature-graphic-1024x500.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0E11",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }}>
        <FetchInterceptor />
        <AuthProvider>
          {children}
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
