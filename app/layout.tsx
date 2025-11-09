// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doña Repartos - El sabor de tu barrio',
  description: 'Apoya a los restaurantes locales y recibe tu comida favorita más rápido que nunca.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50`}>
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main id="main-content" className="flex-grow" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

