'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ShoppingBag, User, Store, Bike, MapPin,
  DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Package, CreditCard, FileText
} from 'lucide-react';
import Link from 'next/link';
import { updateOrderStatus, reassignCourier, cancelOrder } from '../actions';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  in_preparation: 'En preparación', ready_for_pickup: 'Listo para recoger',
  assigned: 'Asignado', picked_up: 'Recogido', on_the_way: 'En camino',
  in_transit: 'En tránsito', delivered: 'Entregado', cancelled: 'Cancelado',
  canceled: 'Cancelado', not_delivered: 'No entregado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_preparation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ready_for_pickup: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  picked_up: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  on_the_way: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  not_delivered: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const TIMELINE_ICON: Record<string, string> = {
  delivered: '✅', cancelled: '❌', canceled: '❌', not_delivered: '⚠️',
  pending: '🕐', on_the_way: '🚴', preparing: '🍳', confirmed: '✔️',
};

const ALL_STATUSES = [
  'pending', 'confirmed', 'preparing', 'in_preparation', 'ready_for_pickup',
  'assigned', 'picked_up', 'on_the_way', 'in_transit', 'delivered', 'cancelled', 'not_delivered',
];

interface OrderDetailProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: orderData },
        { data: timelineData },
        { data: txData },
        { data: couriersData },
      ] = await Promise.all([
        supabase.from('orders').select(`
          *,
          restaurants(id, name, address, phone),
          client:users!orders_user_id_fkey(id, name, email, phone),
          courier:users!orders_delivery_agent_id_fkey(id, name, phone),
          order_items(id, quantity, unit_price, price_at_time_of_order, products(name))
        `).eq('id', id).single(),
        supabase.from('order_status_updates')
          .select('*, updated_by:users!order_status_updates_updated_by_user_id_fkey(name)')
          .eq('order_id', id)
          .order('created_at', { ascending: true }),
        supabase.from('account_transactions')
          .select('*, accounts(account_type, users(name))')
          .eq('order_id', id)
          .order('created_at', { ascending: false }),
        supabase.from('delivery_agent_profiles')
          .select('user_id, users!inner(id, name, phone)')
          .eq('status', 'approved'),
      ]);

      setOrder(orderData);
      setSelectedStatus(orderData?.status || '');
      setSelectedCourier(orderData?.delivery_agent_id || '');
      setTimeline(timelineData || []);
      setTransactions(txData || []);
      setAvailableCouriers(couriersData || []);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === order?.status) return;
    if (!confirm(`¿Cambiar estado a "${STATUS_LABELS[selectedStatus] || selectedStatus}"?`)) return;
    setSaving(true);
    const { error } = await updateOrderStatus(id, selectedStatus as any);
    setSaving(false);
    if (error) { alert('Error: ' + error); return; }
    fetchAll();
  };

  const handleReassignCourier = async () => {
    if (!selectedCourier || selectedCourier === order?.delivery_agent_id) return;
    const courier = availableCouriers.find((c: any) => c.user_id === selectedCourier);
    if (!confirm(`¿Reasignar pedido a ${courier?.users?.name || 'este repartidor'}?`)) return;
    setSaving(true);
    const { error } = await reassignCourier(id, selectedCourier);
    setSaving(false);
    if (error) { alert('Error: ' + error); return; }
    fetchAll();
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { alert('Ingresa la razón de cancelación'); return; }
    if (!confirm('¿Confirmas la cancelación de este pedido?')) return;
    setSaving(true);
    const { error } = await cancelOrder(id, cancelReason);
    setSaving(false);
    if (error) { alert('Error: ' + error); return; }
    setShowCancelForm(false);
    fetchAll();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  const formatDate = (d: string) => new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
            </div>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Pedido no encontrado</p>
        <Link href="/admin/orders" className="text-[#e4007c] hover:underline mt-4 block">← Volver a Pedidos</Link>
      </div>
    );
  }

  const isCancelled = ['cancelled', 'canceled'].includes(order.status);
  const isDelivered = order.status === 'delivered';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Pedidos
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedido #{order.id.slice(0, 8)}</h1>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Info del pedido */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-[#e4007c]" />
                Información del Pedido
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.client?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{order.client?.email}</p>
                  {order.client?.phone && <p className="text-xs text-gray-400">{order.client.phone}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Restaurante</p>
                  <Link href={`/admin/restaurants/${order.restaurant_id}`} className="text-sm font-medium text-[#e4007c] hover:underline">{order.restaurants?.name || '—'}</Link>
                  {order.restaurants?.phone && <p className="text-xs text-gray-400">{order.restaurants.phone}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Bike className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Repartidor</p>
                  {order.courier ? (
                    <>
                      <Link href={`/admin/couriers/${order.delivery_agent_id}`} className="text-sm font-medium text-[#e4007c] hover:underline">{order.courier.name}</Link>
                      {order.courier.phone && <p className="text-xs text-gray-400">{order.courier.phone}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin asignar</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="px-5 pb-4 flex items-start gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dirección de entrega</p>
                <p className="text-sm text-gray-900 dark:text-white">{order.delivery_address || '—'}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Pago:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {order.payment_method === 'cash' ? 'Efectivo'
                  : order.payment_method === 'spei' ? 'SPEI / Transferencia'
                  : order.payment_method || '—'}
              </span>
              <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {order.payment_status || 'pending'}
              </span>
            </div>

            {order.cancellation_reason && (
              <div className="px-5 pb-4 flex items-start gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-500">Razón de cancelación</p>
                  <p className="text-sm text-gray-900 dark:text-white">{order.cancellation_reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Items del pedido */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#e4007c]" />
                Productos
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.products?.name || 'Producto'}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency((item.unit_price || item.price_at_time_of_order) * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="px-5 py-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span><span>{formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Envío</span><span>{formatCurrency(order.delivery_fee || 0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <span>Total</span><span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#e4007c]" />
                Timeline del Pedido
              </h2>
            </div>
            <div className="px-5 py-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin historial de estados</p>
              ) : (
                <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-4">
                  {timeline.map((entry, i) => (
                    <li key={entry.id || i} className="ml-6">
                      <span className="absolute flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 rounded-full -left-3 ring-2 ring-gray-200 dark:ring-gray-700 text-xs">
                        {TIMELINE_ICON[entry.status] || '🔄'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {STATUS_LABELS[entry.status] || entry.status}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
                        {entry.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.notes}</p>}
                        {entry.updated_by?.name && <p className="text-xs text-gray-400">por {entry.updated_by.name}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Transacciones */}
          {transactions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#e4007c]" />
                  Transacciones Financieras
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{tx.type}</p>
                      <p className="text-xs text-gray-400">{tx.description || tx.accounts?.account_type}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                    <p className={`text-sm font-semibold ${Number(tx.amount) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(Math.abs(Number(tx.amount)))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA — Acciones God Mode */}
        <div className="space-y-6">

          {/* Cambiar Estado */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#e4007c]" />
              Cambiar Estado
            </h3>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              disabled={isCancelled || saving}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#e4007c] focus:border-[#e4007c] disabled:opacity-50"
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={saving || selectedStatus === order.status || isCancelled}
              className="mt-3 w-full py-2 px-4 bg-[#e4007c] hover:bg-[#c00068] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Aplicar Estado'}
            </button>
          </div>

          {/* Reasignar Repartidor */}
          {!isDelivered && !isCancelled && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bike className="h-4 w-4 text-[#e4007c]" />
                Reasignar Repartidor
              </h3>
              <select
                value={selectedCourier}
                onChange={e => setSelectedCourier(e.target.value)}
                disabled={saving}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#e4007c] focus:border-[#e4007c]"
              >
                <option value="">Sin repartidor</option>
                {availableCouriers.map((c: any) => (
                  <option key={c.user_id} value={c.user_id}>{c.users?.name || c.user_id}</option>
                ))}
              </select>
              <button
                onClick={handleReassignCourier}
                disabled={saving || selectedCourier === (order.delivery_agent_id || '')}
                className="mt-3 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Reasignar'}
              </button>
            </div>
          )}

          {/* Cancelar Pedido */}
          {!isCancelled && !isDelivered && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm p-5">
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancelar Pedido
              </h3>
              {!showCancelForm ? (
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="w-full py-2 px-4 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors"
                >
                  Iniciar Cancelación
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Razón de cancelación..."
                    rows={3}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelOrder}
                      disabled={saving}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Cancelando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => { setShowCancelForm(false); setCancelReason(''); }}
                      className="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ID Completo */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Completo</p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{order.id}</p>
            {order.order_notes && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Notas del pedido
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">{order.order_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
