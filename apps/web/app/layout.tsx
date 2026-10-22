import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Suivi des ventes', template: '%s · Suivi des ventes' },
  description: 'Rapport quotidien du chiffre d’affaires, des tickets et de la fréquentation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
