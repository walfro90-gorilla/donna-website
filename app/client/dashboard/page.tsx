'use client';

import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';

export default function ClientDashboardPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-[#e4007c]">Doña Repartos</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Hola, {user?.name}</span>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-gray-900">Panel de Cliente</h2>
                            <p className="mt-2 text-gray-600">Bienvenido a tu panel de control.</p>
                            <p className="mt-4 text-sm text-gray-500">Aquí podrás ver tus pedidos y gestionar tu cuenta.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
