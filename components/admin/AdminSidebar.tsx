
'use client';

import { useState, useEffect } from 'react';
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
    LogOut,
    MapPin,
    MessageCircle,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import NotificationsPanel from './NotificationsPanel';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Lock body scroll when drawer is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Restaurantes', href: '/admin/restaurants', icon: Store },
        { name: 'Repartidores', href: '/admin/couriers', icon: Bike },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
        { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Balance', href: '/admin/balance', icon: DollarSign },
        { name: 'Crear Perfil', href: '/admin/create-profile', icon: Users },
        { name: 'Zonas de Cobertura', href: '/admin/coverage-zones', icon: MapPin },
        { name: 'WhatsApp CRM', href: '/admin/crm', icon: MessageCircle },
        { name: 'Configuración', href: '/admin/settings', icon: Settings },
    ];

    return (
        <>
            {/* Mobile top bar — hidden on desktop */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 gap-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 -ml-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Abrir menú de navegación"
                    aria-expanded={isOpen}
                    aria-controls="admin-sidebar"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
                    Donna Admin
                </span>
                <div className="ml-auto">
                    <NotificationsPanel />
                </div>
            </header>

            {/* Overlay backdrop — mobile only */}
            <div
                className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar drawer */}
            <aside
                id="admin-sidebar"
                role="navigation"
                aria-label="Navegación principal"
                className={`
                    fixed left-0 bottom-0 z-50 w-64 flex flex-col
                    bg-sidebar dark:bg-gray-950
                    border-r border-sidebar-border dark:border-gray-800
                    transition-transform duration-300 ease-in-out
                    top-0 md:top-16 lg:top-[72px]
                    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                    md:translate-x-0 md:shadow-none
                `}
            >
                {/* Sidebar header */}
                <div className="flex items-center justify-between h-14 md:h-16 flex-shrink-0 px-4 border-b border-sidebar-border dark:border-gray-800">
                    <span className="text-sidebar-foreground dark:text-white font-bold text-xl">
                        Donna Admin
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="hidden md:block">
                            <NotificationsPanel />
                        </span>
                        {/* Close button — mobile only */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="md:hidden p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto">
                    <nav className="px-2 py-4 space-y-0.5">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-pink-50 dark:bg-pink-950/30 text-[#e4007c]'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <item.icon
                                        className={`flex-shrink-0 h-5 w-5 ${
                                            isActive
                                                ? 'text-[#e4007c]'
                                                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                                        }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sign out */}
                <div className="flex-shrink-0 border-t border-sidebar-border dark:border-gray-800 p-4">
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors group"
                    >
                        <LogOut
                            className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                            aria-hidden="true"
                        />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
}
