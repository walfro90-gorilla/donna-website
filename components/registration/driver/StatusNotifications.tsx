// components/registration/driver/StatusNotifications.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui';
import type { DriverApplicationStatus } from '@/types/form';

export interface StatusNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionText?: string;
  actionUrl?: string;
}

export interface StatusNotificationsProps {
  applicationId: string;
  onNotificationClick?: (notification: StatusNotification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

// Mock function to simulate fetching notifications - in real implementation, this would call an API
const fetchNotifications = async (applicationId: string): Promise<StatusNotification[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data - in real implementation, this would come from the backend
  return [
    {
      id: 'notif_1',
      type: 'success',
      title: 'Documentos Recibidos',
      message: 'Hemos recibido todos tus documentos y comenzaremos la revisión en las próximas 24 horas.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      read: true,
      actionRequired: false
    },
    {
      id: 'notif_2',
      type: 'info',
      title: 'Verificación de Antecedentes Iniciada',
      message: 'Tu verificación de antecedentes ha comenzado. Este proceso puede tomar entre 5-7 días hábiles.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      read: true,
      actionRequired: false
    },
    {
      id: 'notif_3',
      type: 'info',
      title: 'Verificación en Proceso',
      message: 'Tu verificación de antecedentes está progresando normalmente. Te notificaremos cuando esté completa.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      read: false,
      actionRequired: false
    },
    {
      id: 'notif_4',
      type: 'warning',
      title: 'Actualización de Estado',
      message: 'Tu solicitud está siendo revisada por nuestro equipo de seguridad. Esto puede tomar un poco más de tiempo.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      read: false,
      actionRequired: false
    }
  ];
};

const getNotificationIcon = (type: StatusNotification['type']): string => {
  switch (type) {
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'info':
    default:
      return 'ℹ️';
  }
};

const getNotificationColor = (type: StatusNotification['type']): string => {
  switch (type) {
    case 'success':
      return 'border-green-200 bg-green-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    case 'info':
    default:
      return 'border-blue-200 bg-blue-50';
  }
};

const getNotificationTextColor = (type: StatusNotification['type']): string => {
  switch (type) {
    case 'success':
      return 'text-green-900';
    case 'warning':
      return 'text-yellow-900';
    case 'error':
      return 'text-red-900';
    case 'info':
    default:
      return 'text-blue-900';
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
  }
};

export default function StatusNotifications({
  applicationId,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead
}: StatusNotificationsProps) {
  const [notifications, setNotifications] = useState<StatusNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [applicationId]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const notifs = await fetchNotifications(applicationId);
      setNotifications(notifs);
    } catch (err) {
      setError('Error al cargar las notificaciones');
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: StatusNotification) => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    onNotificationClick?.(notification);
    
    // If there's an action URL, navigate to it
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    onMarkAsRead?.(notificationId);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    onMarkAllAsRead?.();
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="outline" className="p-6 text-center">
        <div className="text-red-500 text-2xl mb-2">⚠️</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadNotifications}
          className="mt-3 px-4 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors"
        >
          Reintentar
        </button>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card variant="outline" className="p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay notificaciones
        </h3>
        <p className="text-gray-600">
          Te notificaremos aquí cuando haya actualizaciones sobre tu solicitud.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Notificaciones
          </h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#e4007c] text-white">
              {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-[#e4007c] hover:text-[#c6006b] transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            variant="outline"
            className={`cursor-pointer transition-all hover:shadow-md ${
              !notification.read ? 'ring-2 ring-[#e4007c] ring-opacity-20' : ''
            } ${getNotificationColor(notification.type)}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-semibold ${getNotificationTextColor(notification.type)}`}>
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#e4007c] rounded-full flex-shrink-0"></div>
                    )}
                    {notification.actionRequired && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Acción Requerida
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm mb-2 ${getNotificationTextColor(notification.type)} opacity-90`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    
                    {notification.actionText && (
                      <span className="text-xs text-[#e4007c] font-medium">
                        {notification.actionText} →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More (if needed) */}
      {notifications.length >= 10 && (
        <div className="text-center">
          <button
            onClick={loadNotifications}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cargar más notificaciones
          </button>
        </div>
      )}
    </div>
  );
}