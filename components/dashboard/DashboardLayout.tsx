// components/dashboard/DashboardLayout.tsx
'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/auth';

interface DashboardLayoutProps {
  children: ReactNode;
  userEmail: string;
  userRole: string;
  userName?: string;
}

export default function DashboardLayout({
  children,
  userEmail,
  userRole,
  userName,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    restaurant: 'Restaurante',
    client: 'Cliente',
    delivery: 'Repartidor',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#e4007c]">
                Doña Repartos
              </h1>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-[#e4007c] rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {userName || userEmail}
                  </p>
                  <p className="text-xs text-gray-500">
                    {roleLabels[userRole] || userRole}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e4007c] flex items-center justify-center text-white font-semibold">
                  {(userName || userEmail).charAt(0).toUpperCase()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200 sm:hidden">
                      <p className="text-sm font-medium text-gray-900">
                        {userName || userEmail}
                      </p>
                      <p className="text-xs text-gray-500">
                        {roleLabels[userRole] || userRole}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
