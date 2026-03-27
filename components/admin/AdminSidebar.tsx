
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
    MoreHorizontal,
    X,
    PanelLeft,
    PanelRight,
    FlaskConical,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import NotificationsPanel from './NotificationsPanel';

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
    { name: 'Bulk Actions', href: '/admin/bulk-actions', icon: FlaskConical },
];

// Los 4 tabs más usados en el bottom bar
const bottomTabs = [
    { name: 'Inicio', href: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
    { name: 'CRM', href: '/admin/crm', icon: MessageCircle },
    { name: 'Restaurantes', href: '/admin/restaurants', icon: Store },
];

// Resto de items en el panel "Más"
const moreItems = navigation.filter(
    (item) => !bottomTabs.some((tab) => tab.href === item.href)
);

interface AdminSidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const [showMore, setShowMore] = useState(false);

    // Cerrar el panel "Más" al navegar
    useEffect(() => {
        setShowMore(false);
    }, [pathname]);

    // Bloquear scroll del body cuando el panel "Más" está abierto
    useEffect(() => {
        document.body.style.overflow = showMore ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showMore]);

    const isMoreActive = moreItems.some((item) => pathname === item.href);

    return (
        <>
            {/* ── Desktop sidebar (md+) ── */}
            <aside
                role="navigation"
                aria-label="Navegación principal"
                className={`hidden md:flex md:flex-col md:fixed md:top-16 lg:top-[72px] md:bottom-0
                    bg-sidebar dark:bg-gray-900 border-r border-sidebar-border dark:border-gray-700
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}
            >
                {/* Header */}
                <div className={`flex items-center h-16 flex-shrink-0 px-3 border-b border-sidebar-border dark:border-gray-700 ${
                    isCollapsed ? 'justify-center' : 'justify-between'
                }`}>
                    {!isCollapsed && (
                        <span className="text-sidebar-foreground dark:text-white font-bold text-xl truncate">
                            Donna Admin
                        </span>
                    )}
                    <div className={`flex items-center ${isCollapsed ? '' : 'gap-1'}`}>
                        {!isCollapsed && <NotificationsPanel />}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                            aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                            title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                        >
                            {isCollapsed
                                ? <PanelRight className="h-5 w-5" aria-hidden="true" />
                                : <PanelLeft className="h-5 w-5" aria-hidden="true" />
                            }
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <nav className={`${isCollapsed ? 'px-1' : 'px-2'} py-4 space-y-0.5`}>
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={isCollapsed ? item.name : undefined}
                                    aria-label={isCollapsed ? item.name : undefined}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`group flex items-center rounded-lg transition-colors text-sm font-medium
                                        ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'}
                                        ${isActive
                                            ? 'bg-pink-50 dark:bg-pink-950/50 text-[#e4007c]'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <item.icon
                                        className={`flex-shrink-0 h-5 w-5 ${
                                            isActive
                                                ? 'text-[#e4007c]'
                                                : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                                        }`}
                                        aria-hidden={!isCollapsed}
                                    />
                                    {!isCollapsed && item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sign out */}
                <div className={`flex-shrink-0 border-t border-sidebar-border dark:border-gray-700 ${isCollapsed ? 'p-2' : 'p-4'}`}>
                    <button
                        onClick={() => signOut()}
                        title={isCollapsed ? 'Cerrar Sesión' : undefined}
                        aria-label={isCollapsed ? 'Cerrar Sesión' : undefined}
                        className={`w-full flex items-center rounded-lg text-sm font-medium
                            text-gray-600 dark:text-gray-300
                            hover:bg-gray-50 dark:hover:bg-gray-800
                            hover:text-gray-900 dark:hover:text-white
                            transition-colors group
                            ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}`}
                    >
                        <LogOut
                            className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                            aria-hidden={!isCollapsed}
                        />
                        {!isCollapsed && 'Cerrar Sesión'}
                    </button>
                </div>
            </aside>

            {/* ── Mobile bottom navigation bar ── */}
            <nav
                role="navigation"
                aria-label="Navegación principal"
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-stretch"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {bottomTabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors"
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <tab.icon
                                className={`h-5 w-5 transition-colors ${isActive ? 'text-[#e4007c]' : 'text-gray-400 dark:text-gray-500'}`}
                                aria-hidden="true"
                            />
                            <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-[#e4007c]' : 'text-gray-500 dark:text-gray-400'}`}>
                                {tab.name}
                            </span>
                            {isActive && (
                                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#e4007c]" aria-hidden="true" />
                            )}
                        </Link>
                    );
                })}

                {/* Botón "Más" */}
                <button
                    onClick={() => setShowMore(true)}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors"
                    aria-label="Más opciones"
                    aria-expanded={showMore}
                >
                    <MoreHorizontal
                        className={`h-5 w-5 ${isMoreActive ? 'text-[#e4007c]' : 'text-gray-400 dark:text-gray-500'}`}
                        aria-hidden="true"
                    />
                    <span className={`text-[10px] font-medium leading-tight ${isMoreActive ? 'text-[#e4007c]' : 'text-gray-500 dark:text-gray-400'}`}>
                        Más
                    </span>
                    {isMoreActive && (
                        <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#e4007c]" aria-hidden="true" />
                    )}
                </button>
            </nav>

            {/* ── Panel "Más" — bottom sheet ── */}
            {/* Backdrop */}
            <div
                className={`md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                    showMore ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setShowMore(false)}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Más opciones de navegación"
                className={`md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white dark:bg-gray-950 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
                    showMore ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Handle + header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                    <span className="text-base font-semibold text-gray-900 dark:text-white">Menú</span>
                    <div className="flex items-center gap-2">
                        <NotificationsPanel />
                        <button
                            onClick={() => setShowMore(false)}
                            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Nav items grid */}
                <div className="px-4 pb-2">
                    <div className="grid grid-cols-3 gap-2 py-3">
                        {moreItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                                        isActive
                                            ? 'bg-pink-50 dark:bg-pink-950/30'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <item.icon
                                        className={`h-6 w-6 ${isActive ? 'text-[#e4007c]' : 'text-gray-500 dark:text-gray-400'}`}
                                        aria-hidden="true"
                                    />
                                    <span className={`text-xs font-medium text-center leading-tight ${isActive ? 'text-[#e4007c]' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Divider + Sign out */}
                <div className="border-t border-gray-100 dark:border-gray-800 mx-4" />
                <div className="px-4 py-3">
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </>
    );
}
