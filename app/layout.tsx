// app/layout.tsx
import './globals.css';
import Script from 'next/script';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import { AuthProvider } from '@/lib/auth/context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Doña Repartos - El sabor de tu barrio',
    template: '%s | Doña Repartos',
  },
  description: 'Apoya a los restaurantes locales y recibe tu comida favorita más rápido que nunca. Únete a la comunidad de Doña Repartos.',
  keywords: ['comida', 'delivery', 'restaurantes', 'local', 'barrio', 'reparto', 'app', 'méxico'],
  authors: [{ name: 'Doña Repartos Team' }],
  creator: 'Doña Repartos',
  metadataBase: new URL('https://doña.app'),
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://doña.app',
    title: 'Doña Repartos - El sabor de tu barrio',
    description: 'Pide tu comida favorita de los mejores restaurantes locales. Rápido, seguro y con el sazón de siempre.',
    siteName: 'Doña Repartos',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Doña Repartos - El sabor de tu barrio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Doña Repartos - El sabor de tu barrio',
    description: 'Apoya a los restaurantes locales y recibe tu comida favorita más rápido que nunca.',
    images: ['/twitter-image.png'],
    creator: '@donarepartos',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

import { ThemeProvider } from '@/components/ThemeProvider';

// ... (imports)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5E6HYJ6TF5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-5E6HYJ6TF5');
          `}
        </Script>

        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}

