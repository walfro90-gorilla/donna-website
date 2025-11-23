'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    Download
} from 'lucide-react';
import { TransactionWithDetails } from '@/app/admin/balance/actions';

interface TransactionsTableProps {
    transactions: TransactionWithDetails[];
    totalPages: number;
    currentPage: number;
}

const TRANSACTION_TYPES = [
    'ORDER_REVENUE',
    'PLATFORM_COMMISSION',
    'DELIVERY_EARNING',
    'CASH_COLLECTED',
    'SETTLEMENT_PAYMENT',
    'SETTLEMENT_RECEPTION',
    'RESTAURANT_PAYABLE',
    'DELIVERY_PAYABLE',
    'PLATFORM_DELIVERY_MARGIN',
    'PLATFORM_NOT_DELIVERED_REFUND',
    'CLIENT_DEBT'
];

const ACCOUNT_TYPES = [
    'restaurant',
    'delivery_agent',
    'client',
    'platform'
];

export default function TransactionsTable({
    transactions,
    totalPages,
    currentPage
}: TransactionsTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state for filters to avoid excessive URL updates while typing/selecting
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
    const [accountTypeFilter, setAccountTypeFilter] = useState(searchParams.get('accountType') || 'all');

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1'); // Reset to page 1 on filter change
        router.push(`${pathname}?${params.toString()}`);
    };

    const changePage = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAccountName = (transaction: TransactionWithDetails) => {
        if (!transaction.account) return 'Sistema';

        // Check if it's a restaurant account via user relation
        if (transaction.account.account_type === 'restaurant' &&
            transaction.account.user?.restaurant &&
            transaction.account.user.restaurant.length > 0) {
            return transaction.account.user.restaurant[0].name;
        }

        if (transaction.account.user) {
            return transaction.account.user.name || transaction.account.user.email || 'Usuario sin nombre';
        }

        return transaction.account.account_type; // Fallback
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header & Filters */}
            <div className="p-5 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 className="text-lg font-medium text-gray-900">Transacciones</h3>

                    <div className="flex flex-wrap gap-3">
                        {/* Type Filter */}
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    updateFilters('type', e.target.value);
                                }}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="all">Todos los Tipos</option>
                                {TRANSACTION_TYPES.map(type => (
                                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>

                        {/* Account Type Filter */}
                        <div className="relative">
                            <select
                                value={accountTypeFilter}
                                onChange={(e) => {
                                    setAccountTypeFilter(e.target.value);
                                    updateFilters('accountType', e.target.value);
                                }}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="all">Todas las Cuentas</option>
                                {ACCOUNT_TYPES.map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cuenta
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Detalles
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(transaction.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {transaction.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{getAccountName(transaction)}</span>
                                            <span className="text-xs text-gray-500 capitalize">
                                                {transaction.account?.account_type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className={`flex items-center ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {transaction.amount >= 0 ? (
                                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                            ) : (
                                                <ArrowDownLeft className="h-4 w-4 mr-1" />
                                            )}
                                            {formatCurrency(transaction.amount)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {transaction.order_id && (
                                            <span className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                                                Orden #{transaction.order_id.slice(0, 8)}
                                            </span>
                                        )}
                                        {transaction.description && (
                                            <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                                                {transaction.description}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                                    No se encontraron transacciones con los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => changePage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="sr-only">Anterior</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="sr-only">Siguiente</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
