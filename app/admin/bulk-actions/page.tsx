'use client';

import { useState } from 'react';
import { FlaskConical, ShoppingBag, Users } from 'lucide-react';
import OrdersTab from './components/OrdersTab';
import UsersTab from './components/UsersTab';

const TABS = [
  { id: 'orders', label: 'Pedidos de prueba', icon: ShoppingBag },
  { id: 'users',  label: 'Usuarios de prueba',  icon: Users },
] as const;

type TabId = typeof TABS[number]['id'];

export default function BulkActionsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('orders');

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
          <FlaskConical className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Acciones en Masa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Identifica y elimina pedidos o usuarios de prueba sin afectar los balances reales.
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
        <strong>Zona de operaciones destructivas.</strong> Las eliminaciones son permanentes e irreversibles.
        Las transacciones financieras serán revertidas automáticamente antes de borrar.
        Los registros con liquidaciones completadas serán protegidos y omitidos.
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${isActive
                    ? 'border-[#e4007c] text-[#e4007c]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="pb-8">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'users'  && <UsersTab />}
      </div>

      {/* Global styles for shared input-field and btn-secondary */}
      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          background-color: white;
          color: rgb(17 24 39);
        }
        .dark .input-field {
          border-color: rgb(55 65 81);
          background-color: rgb(31 41 55);
          color: rgb(243 244 246);
        }
        .input-field:focus {
          outline: none;
          ring: 2px;
          ring-color: #e4007c;
        }
        .btn-secondary {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          background-color: white;
          color: rgb(55 65 81);
          transition: background-color 0.15s;
        }
        .btn-secondary:hover {
          background-color: rgb(249 250 251);
        }
        .dark .btn-secondary {
          border-color: rgb(55 65 81);
          background-color: rgb(31 41 55);
          color: rgb(209 213 219);
        }
        .dark .btn-secondary:hover {
          background-color: rgb(17 24 39);
        }
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
