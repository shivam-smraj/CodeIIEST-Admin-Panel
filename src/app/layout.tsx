import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { SplashScreen } from "@/components/ui/splash-screen";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CodeIIEST Admin Portal",
  description: "Official unified Admin Portal for managing events, users, and tasks for CodeIIEST, IIEST Shibpur.",
  icons: {
    icon: [
      { url: "/favicon.svg",       type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "CodeIIEST Admin Portal",
    description: "Official Admin and User portal for the CodeIIEST coding club at IIEST Shibpur.",
    siteName: "CodeIIEST Portal",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <AuthProvider>
          <SplashScreen />
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
