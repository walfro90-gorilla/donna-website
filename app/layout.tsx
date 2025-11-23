// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import { AuthProvider } from '@/lib/auth/context';

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
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
          {/* Skip to main content link - Requirement 14.3 */}
          <a href="#main-content" className="skip-to-main">
            Saltar al contenido principal
          </a>
          <div className="flex flex-col min-h-screen">
            <Header />
            {/* Main content with proper ARIA landmark and keyboard focus support - Requirements 14.2, 14.3 */}
            <main id="main-content" className="flex-grow" tabIndex={-1} role="main" aria-label="Contenido principal">
              {children}
            </main>
            <Footer />
            <CookieConsent />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

