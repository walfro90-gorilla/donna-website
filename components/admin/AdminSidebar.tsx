
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    Bike,
    Users,
    ShoppingBag,
    DollarSign,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import NotificationsPanel from './NotificationsPanel';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Restaurantes', href: '/admin/restaurants', icon: Store },
        { name: 'Repartidores', href: '/admin/couriers', icon: Bike },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
        { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Balance', href: '/admin/balance', icon: DollarSign },
        { name: 'Crear Perfil', href: '/admin/create-profile', icon: Users },
        { name: 'Configuración', href: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:top-16 lg:md:top-[72px] md:bottom-0 bg-sidebar dark:bg-gray-950 border-r border-sidebar-border dark:border-gray-800">
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-sidebar-border">
                    <span className="text-sidebar-foreground dark:text-white font-bold text-xl">Donna Admin</span>
                    <NotificationsPanel />
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-gray-100 dark:bg-gray-800 text-[#e4007c]'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <item.icon
                                        className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive ? 'text-[#e4007c]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                                            }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
                    <button
                        onClick={() => signOut()}
                        className="flex-shrink-0 w-full group block"
                    >
                        <div className="flex items-center">
                            <LogOut className="inline-block h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                                    Cerrar Sesión
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
