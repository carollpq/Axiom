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
  icons: {
    icon: '/axiom-logo.png',
    apple: '/axiom-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/pdf.worker.min.mjs"
          as="worker"
          type="text/javascript"
        />
      </head>
      <body className={`${inter.className} ${tinos.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
