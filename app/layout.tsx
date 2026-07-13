import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const TITLE = 'Digitaalinen tuotepassi – Tuotetiedot, dokumentit ja EU-vaatimusten hallinta';
const DESCRIPTION = 'Yksi paikka tuotetiedoille, dokumenteille ja EU-vaatimusten hallintaan. Sopii koruille, design-tuotteille, tekstiileille ja käsityötuotteille.';

export const metadata: Metadata = {
  metadataBase: new URL('https://digitaalinentuotepassi.tulkintatila.fi'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'fi_FI',
    siteName: 'Digitaalinen tuotepassi',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fi" className={inter.className}>
        <body className="min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
