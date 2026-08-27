import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ServiceWorkerRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: "Inkto — Legal Document Transcription",
  description: "Convert handwritten and scanned legal documents to editable text in seconds.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ background: "#FBFAF7", margin: 0, padding: 0 }}>
        <AuthProvider>
          {/*
            Phone-width shell.
            background: Paper White — the one correct warm value.
            No box-shadow card-effect — this is letterhead, not a widget.
          */}
          <div
            id="app-shell"
            style={{
              margin: "0 auto",
              maxWidth: 448,
              minHeight: "100svh",
              background: "#FBFAF7",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <main
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "0 20px",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {children}
            </main>
          </div>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
