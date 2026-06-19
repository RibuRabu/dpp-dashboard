import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digitaalinen tuotepassi',
  description: 'DPP hallintapaneeli',
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
