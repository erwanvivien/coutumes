import type { Metadata } from 'next';
import { Archivo, Newsreader } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Suivi des ventes', template: '%s · Suivi des ventes' },
  description: 'Rapport quotidien du chiffre d’affaires, des tickets et de la fréquentation',
};

// Free stand-ins for the Coutumes typefaces: Archivo's width axis gives both the condensed
// headline face (Plaak 3) and the wide small-caps labels (Plaak 6); Newsreader the serif (Exposure)
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' });
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${archivo.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
