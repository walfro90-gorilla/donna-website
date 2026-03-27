'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Search, FlaskConical, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import {
  fetchTestOrders,
  previewDeleteOrders,
  deleteOrdersBulk,
  markAsTest,
  type BulkOrder,
  type PreviewResult,
} from '../actions';
import ImpactPreview from './ImpactPreview';
import ConfirmModal from './ConfirmModal';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'not_delivered', label: 'No entregado' },
];

export default function OrdersTab() {
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filtros
  const [filterIsTest, setFilterIsTest] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  function handleSearch() {
    startTransition(async () => {
      const isTest =
        filterIsTest === 'test' ? true : filterIsTest === 'real' ? false : undefined;

      const { data, error } = await fetchTestOrders({
        isTest,
        status: filterStatus || undefined,
        emailContains: filterEmail || undefined,
        maxAmount: filterMaxAmount ? Number(filterMaxAmount) : undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      });

      if (error) { toast.error(error); return; }
      setOrders(data);
      setSelected(new Set());
      setPreview(null);
      setHasSearched(true);
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setPreview(null);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = prev.size === orders.length
        ? new Set<string>()
        : new Set(orders.map((o) => o.id));
      setPreview(null);
      return next;
    });
  }

  function handlePreview() {
    if (!selected.size) return;
    startTransition(async () => {
      const { data, error } = await previewDeleteOrders(Array.from(selected));
      if (error) { toast.error(error); return; }
      setPreview(data);
    });
  }

  function handleMarkAsTest(isTest: boolean) {
    if (!selected.size) return;
    startTransition(async () => {
      const { error } = await markAsTest('order', Array.from(selected), isTest);
      if (error) { toast.error(error); return; }
      toast.success(`${selected.size} pedido(s) marcado(s) como ${isTest ? 'prueba' : 'real'}`);
      handleSearch();
    });
  }

  async function handleDelete() {
    setIsDeleting(true);
    setShowConfirm(false);
    try {
      const result = await deleteOrdersBulk(Array.from(selected));
      if (result.error) { toast.error(result.error); return; }

      const msg = result.skipped.length > 0
        ? `${result.deleted} pedido(s) eliminado(s). ${result.skipped.length} omitido(s) por liquidaciones completadas.`
        : `${result.deleted} pedido(s) eliminado(s) correctamente.`;

      toast.success(msg, { duration: 5000 });
      setSelected(new Set());
      setPreview(null);
      handleSearch();
    } finally {
      setIsDeleting(false);
    }
  }

  const allSelected = orders.length > 0 && selected.size === orders.length;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={filterIsTest}
            onChange={(e) => setFilterIsTest(e.target.value)}
            className="input-field"
          >
            <option value="all">Todos</option>
            <option value="test">Solo prueba</option>
            <option value="real">Solo reales</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Email cliente"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            className="input-field"
          />

          <input
            type="number"
            placeholder="Monto máx. ($)"
            value={filterMaxAmount}
            onChange={(e) => setFilterMaxAmount(e.target.value)}
            className="input-field"
          />

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="input-field"
            title="Desde"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="input-field"
            title="Hasta"
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {isPending ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Acciones sobre selección */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {selected.size} seleccionado(s)
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button
              onClick={() => handleMarkAsTest(true)}
              disabled={isPending}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Marcar como prueba
            </button>
            <button
              onClick={() => handleMarkAsTest(false)}
              disabled={isPending}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <ToggleRight className="h-3.5 w-3.5" />
              Marcar como real
            </button>
            <button
              onClick={handlePreview}
              disabled={isPending}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Ver impacto
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isPending || isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Preview de impacto */}
      <ImpactPreview preview={preview} entityType="orders" selectedCount={selected.size} />

      {/* Tabla */}
      {hasSearched && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron pedidos con esos filtros
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-[#e4007c] focus:ring-[#e4007c]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Restaurante</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        selected.has(order.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded border-gray-300 text-[#e4007c] focus:ring-[#e4007c]"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{order.user_name ?? '—'}</div>
                        <div className="text-xs text-gray-500">{order.user_email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {order.restaurant_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        ${order.total_amount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {order.is_test && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            <FlaskConical className="h-3 w-3" />
                            prueba
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title={`Eliminar ${selected.size} pedido(s)`}
        description="Esta acción es irreversible. Las transacciones financieras serán revertidas y los balances recalculados."
        confirmWord="ELIMINAR"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={isDeleting}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    not_delivered: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
      {status}
    </span>
  );
}
