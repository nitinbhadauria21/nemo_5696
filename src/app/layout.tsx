import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Fredoka, DM_Sans, Space_Mono } from 'next/font/google';
import '../styles/tailwind.css';
import '../styles/landing.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF5A1F',
};

export const metadata: Metadata = {
  title: 'NEMO — Catch Every Trend Before It Peaks',
  description:
    'Real-time trend detection across Google Trends, YouTube Shorts, Instagram Reels, and LinkedIn. AI-powered analysis and content ideas for creators.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/assets/images/1-1783875917780.png', type: 'image/png' }],
    apple: '/assets/images/1-1783875917780.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${dmSans.variable} ${spaceMono.variable}`}>
      <body className={dmSans.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--card)',
                  color: 'var(--card-foreground)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-sans)',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
