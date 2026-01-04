'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, User } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'client')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(search.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Usuarios (Clientes)</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Lista de todos los clientes registrados en la plataforma.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative rounded-md shadow-sm max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-[#e4007c] focus:border-[#e4007c] block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md p-2 border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Usuario</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Contacto</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha Registro</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">Cargando...</td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">No se encontraron usuarios</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="font-medium text-gray-900 dark:text-white">{user.name || 'Sin nombre'}</div>
                                                            <div className="text-gray-500 dark:text-gray-400 text-xs">ID: {user.id.slice(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="text-gray-900 dark:text-white">{user.email}</div>
                                                    <div className="text-gray-500 dark:text-gray-400">{user.phone || '-'}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {/* Actions if needed */}
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
