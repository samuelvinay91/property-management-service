import './globals.css';
import type { Metadata } from 'next';
import { Inter, Lexend } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PropFlow - Smart Property Management Platform',
    template: '%s | PropFlow',
  },
  description: 'Comprehensive AI-powered property management platform with intelligent automation, real-time communication, and seamless booking system.',
  keywords: ['property management', 'real estate', 'AI', 'automation', 'booking', 'payments'],
  authors: [{ name: 'PropFlow Team' }],
  creator: 'PropFlow',
  publisher: 'PropFlow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'PropFlow - Smart Property Management Platform',
    description: 'Comprehensive AI-powered property management platform with intelligent automation.',
    siteName: 'PropFlow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PropFlow - Smart Property Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropFlow - Smart Property Management Platform',
    description: 'Comprehensive AI-powered property management platform with intelligent automation.',
    images: ['/og-image.png'],
    creator: '@propflow',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: 'hsl(var(--primary-foreground))',
                },
              },
              error: {
                iconTheme: {
                  primary: 'hsl(var(--destructive))',
                  secondary: 'hsl(var(--destructive-foreground))',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}