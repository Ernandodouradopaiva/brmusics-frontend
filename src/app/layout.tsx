import type { Metadata, Viewport } from 'next';
import { Great_Vibes } from 'next/font/google';
import { Providers } from '@/providers';
import './globals.css';

const scriptFont = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-script',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BRMusics',
  description: 'Escalas, repertórios e comunicação dos músicos.',
  applicationName: 'BRMusics',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BRMusics',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#4a2c18',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={scriptFont.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
