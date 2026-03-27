'use client';

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { PreviewResult } from '../actions';

interface Props {
  preview: PreviewResult | null;
  entityType: 'orders' | 'users';
  selectedCount: number;
}

export default function ImpactPreview({ preview, entityType, selectedCount }: Props) {
  if (!preview || selectedCount === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        Selecciona elementos para ver el impacto antes de eliminar
      </div>
    );
  }

  const hasWarning =
    preview.has_completed_settlements ||
    preview.has_restaurant_with_orders;

  const skippable = preview.skippable_orders?.length ?? 0;
  const safeToDelete =
    entityType === 'orders'
      ? (preview.orders_total ?? 0) - skippable
      : (preview.users_total ?? 0);

  return (
    <div className={`rounded-xl border p-4 space-y-3 text-sm
      ${hasWarning
        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20'
        : 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
        {hasWarning
          ? <AlertTriangle className="h-4 w-4 text-amber-500" />
          : <CheckCircle className="h-4 w-4 text-green-500" />
        }
        Impacto de la operación
      </div>

      <div className="grid grid-cols-2 gap-2">
        {entityType === 'orders' ? (
          <>
            <Stat label="Pedidos seleccionados" value={preview.orders_total ?? 0} />
            <Stat label="Se eliminarán" value={safeToDelete} highlight />
            <Stat label="Transacciones a revertir" value={preview.transactions_total ?? 0} />
            <Stat label="Cuentas afectadas" value={preview.accounts_affected ?? 0} />
            {skippable > 0 && (
              <Stat label="Omitidos (liquidación completada)" value={skippable} warn />
            )}
          </>
        ) : (
          <>
            <Stat label="Usuarios seleccionados" value={preview.users_total ?? 0} />
            <Stat label="Pedidos asociados" value={preview.orders_total ?? 0} />
          </>
        )}
      </div>

      {hasWarning && (
        <div className="flex gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3 text-amber-800 dark:text-amber-200">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            {preview.has_completed_settlements && 'Algunos registros tienen liquidaciones completadas y serán omitidos. '}
            {preview.has_restaurant_with_orders && 'Algunos restaurantes tienen pedidos de clientes reales y serán omitidos.'}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700">
      <div className={`text-lg font-bold ${
        warn ? 'text-amber-600' : highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
      }`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{label}</div>
    </div>
  );
}
