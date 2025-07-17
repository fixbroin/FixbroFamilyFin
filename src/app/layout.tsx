import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/toaster";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Fixbro FamilyFin";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://balance.fixbro.in";
const META_TITLE = process.env.NEXT_PUBLIC_META_TITLE || APP_NAME;
const META_DESCRIPTION = process.env.NEXT_PUBLIC_META_DESCRIPTION || "Shared expense tracker and shopping list for your family.";
const META_KEYWORDS = process.env.NEXT_PUBLIC_META_KEYWORDS?.split(',').map(k => k.trim()) || [];


export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: META_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: META_DESCRIPTION,
  keywords: META_KEYWORDS,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: META_TITLE,
      template: `%s | ${APP_NAME}`,
    },
    description: META_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 1200,
        height: 630,
        alt: 'FamilyFin by Fixbro Application Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: META_TITLE,
      template: `%s | ${APP_NAME}`,
    },
    description: META_DESCRIPTION,
    images: ['/android-chrome-512x512.png'],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: '#D0BFFF',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full bg-background">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
