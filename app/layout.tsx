import type {Metadata} from 'next';
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';
import { ToastContainer } from '@/shared/ui/ToastContainer';
import './globals.css'; // Global styles

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  weight: ['300', '400', '500', '600', '700', '900'],
});

export const metadata: Metadata = {
  title: 'QRMenu Pro — Gestion et Commande Restaurant SaaS',
  description: 'Espace d\'administration unifié et menus QR interactifs pour les professionnels de la restauration.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fr" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-bg text-text-primary antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
