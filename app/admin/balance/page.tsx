import { Suspense } from 'react';
import { getBalanceStats, getTransactions } from './actions';
import BalanceStats from '@/components/admin/balance/BalanceStats';
import TransactionsTable from '@/components/admin/balance/TransactionsTable';

export const metadata = {
    title: 'Balance Financiero | Donna Admin',
    description: 'Monitor de balance y transacciones del sistema',
};

export default async function AdminBalancePage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const page = Number(searchParams.page) || 1;
    const type = typeof searchParams.type === 'string' ? searchParams.type : undefined;
    const accountType = typeof searchParams.accountType === 'string' ? searchParams.accountType : undefined;

    // Fetch data in parallel
    const [stats, transactionsData] = await Promise.all([
        getBalanceStats(),
        getTransactions(page, 20, { type, accountType }),
    ]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Balance Financiero</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Supervisión de fondos, deudas y transacciones en tiempo real.
                </p>
            </div>

            <div className="mb-8">
                <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>}>
                    <BalanceStats stats={stats} />
                </Suspense>
            </div>

            <div>
                <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>}>
                    <TransactionsTable
                        transactions={transactionsData.data}
                        totalPages={transactionsData.totalPages}
                        currentPage={page}
                    />
                </Suspense>
            </div>
        </div>
    );
}
