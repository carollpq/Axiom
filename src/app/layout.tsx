import type { Metadata } from 'next';
import { Inter, Tinos } from 'next/font/google';
import './globals.css';
import { Providers } from './providers.client';

const inter = Inter({ subsets: ['latin'] });

const tinos = Tinos({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-tinos',
});

export const metadata: Metadata = {
  title: 'Axiom',
  description:
    'Blockchain-backed academic peer review. Fair, transparent, accountable.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${tinos.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
