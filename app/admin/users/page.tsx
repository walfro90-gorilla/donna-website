'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, User, AlertTriangle, Eye, ShoppingBag } from 'lucide-react';

interface UserRow {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    created_at: string;
    orderCount?: number;
    pendingDebtCount?: number;
    isSuspended?: boolean;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: usersData, error } = await supabase
                .from('users')
                .select('id, name, email, phone, created_at')
                .eq('role', 'client')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;

            const enriched = await Promise.all(
                (usersData || []).map(async (u) => {
                    const [
                        { count: orderCount },
                        { count: debtCount },
                        { data: suspension },
                    ] = await Promise.all([
                        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
                        supabase.from('client_debts').select('*', { count: 'exact', head: true }).eq('client_id', u.id).eq('status', 'pending'),
                        supabase.from('client_account_suspensions').select('is_suspended').eq('client_id', u.id).single(),
                    ]);
                    return {
                        ...u,
                        orderCount: orderCount || 0,
                        pendingDebtCount: debtCount || 0,
                        isSuspended: suspension?.is_suspended || false,
                    };
                })
            );

            setUsers(enriched);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const q = search.toLowerCase();
        return (u.name?.toLowerCase() || '').includes(q) || (u.email?.toLowerCase() || '').includes(q);
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Usuarios (Clientes)</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {filteredUsers.length} clientes. Haz clic para ver el perfil completo con deudas y pedidos.
                    </p>
                </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative rounded-md shadow-sm max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-[#e4007c] focus:border-[#e4007c] block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md p-2 border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Usuario</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Contacto</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Pedidos</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Registro</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Ver</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No se encontraron usuarios</td></tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                onClick={() => router.push(`/admin/users/${user.id}`)}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                            >
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                            <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{user.name || 'Sin nombre'}</div>
                                                            <div className="text-gray-400 text-xs font-mono">#{user.id.slice(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div>{user.email}</div>
                                                    <div className="text-xs">{user.phone || '—'}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                                        <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                                                        {user.orderCount}
                                                    </div>
                                                    {(user.pendingDebtCount || 0) > 0 && (
                                                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-0.5">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {user.pendingDebtCount} deuda{user.pendingDebtCount !== 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    {user.isSuspended ? (
                                                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                            Suspendido
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            Activo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(user.created_at).toLocaleDateString('es-MX')}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <Eye className="h-4 w-4 text-[#e4007c] inline-block" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
