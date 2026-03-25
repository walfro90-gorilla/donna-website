'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { LoadingSpinner } from '@/components/ui';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminSidebarCollapsed') === 'true';
        }
        return false;
    });

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'admin') {
                router.push('/');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        localStorage.setItem('adminSidebarCollapsed', String(isCollapsed));
    }, [isCollapsed]);

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
                <LoadingSpinner isLoading={true} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
                <main className="flex-1 pb-20 md:pb-0">
                    <div className="mt-8">
                        {children}
                    </div>
                </main>
                <footer className="hidden md:block border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-950 py-3 px-6">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>© {new Date().getFullYear()} Doña Repartos</span>
                        <div className="flex items-center gap-4">
                            <a href="/legal/privacidad" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Privacidad</a>
                            <a href="/legal/terminos" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Términos</a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
