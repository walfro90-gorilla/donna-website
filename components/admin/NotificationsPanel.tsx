'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    category: string;
    entity_type: string;
    entity_id: string;
    is_read: boolean;
    created_at: string;
    metadata: any;
}

export default function NotificationsPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('NotificationsPanel mounted');
        fetchNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel('admin_notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_notifications',
                    filter: 'target_role=eq.admin'
                },
                (payload) => {
                    console.log('New notification received:', payload);
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            console.log('Fetching notifications...');
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .eq('target_role', 'admin')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching notifications:', error);
                throw error;
            }

            console.log('Notifications fetched:', data?.length);
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error('Error in fetchNotifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await supabase
                .from('admin_notifications')
                .update({ is_read: true })
                .eq('id', id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

            if (unreadIds.length === 0) return;

            await supabase
                .from('admin_notifications')
                .update({ is_read: true })
                .in('id', unreadIds);

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'registration':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'order':
                return <Info className="h-5 w-5 text-blue-500" />;
            case 'system':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getEntityLink = (notification: Notification) => {
        switch (notification.entity_type) {
            case 'restaurant':
                return '/admin/restaurants';
            case 'delivery_agent':
                return '/admin/couriers';
            case 'user':
                return '/admin/users';
            default:
                return '/admin';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
        if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
        return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
    };

    return (
        <div className="relative z-50">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-[#e4007c] rounded-full transition-colors"
                aria-label="Notificaciones"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-[#e4007c] text-white text-xs font-bold flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Panel */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-card rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 max-h-[80vh] overflow-hidden flex flex-col origin-top-left border border-border">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/50">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-[#e4007c] hover:text-[#c00068] font-medium"
                                    >
                                        Marcar leídas
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e4007c] mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                                    <p className="text-sm">No hay notificaciones</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((notification) => (
                                        <Link
                                            key={notification.id}
                                            href={getEntityLink(notification)}
                                            onClick={() => {
                                                markAsRead(notification.id);
                                                setIsOpen(false);
                                            }}
                                            className={`block px-4 py-3 hover:bg-muted/50 transition-colors ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getCategoryIcon(notification.category)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                                        {formatTimeAgo(notification.created_at)}
                                                    </p>
                                                </div>
                                                {!notification.is_read && (
                                                    <div className="flex-shrink-0 self-center">
                                                        <div className="h-2 w-2 bg-[#e4007c] rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
