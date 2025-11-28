'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { LoadingSpinner } from '@/components/ui';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'admin') {
                router.push('/'); // Redirect non-admins
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router]);

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
                <LoadingSpinner isLoading={true} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
            <AdminSidebar />
            <div className="md:pl-64 flex flex-col flex-1">
                <main className="flex-1 pb-8">
                    <div className="mt-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
