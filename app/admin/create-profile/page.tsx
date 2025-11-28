'use client';

import { useState, useActionState } from 'react';
import { createUserProfile, CreateUserState } from '@/actions/admin/create-user';
import { LoadingSpinner } from '@/components/ui';
import { User, Store, Bike, CheckCircle, AlertCircle } from 'lucide-react';

const initialState: CreateUserState = {
    message: '',
};

export default function CreateProfilePage() {
    const [state, formAction, isPending] = useActionState(createUserProfile, initialState);
    const [role, setRole] = useState<'client' | 'restaurant' | 'delivery_agent'>('client');

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Crear Nuevo Perfil</h1>

            <div className="bg-card border border-border shadow rounded-lg overflow-hidden">
                <div className="p-6">
                    <form action={formAction} className="space-y-6">

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Perfil</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('client')}
                                    className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${role === 'client'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <User className="h-6 w-6 mr-2" />
                                    <span className="font-medium">Cliente</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('restaurant')}
                                    className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${role === 'restaurant'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <Store className="h-6 w-6 mr-2" />
                                    <span className="font-medium">Restaurante</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('delivery_agent')}
                                    className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${role === 'delivery_agent'
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <Bike className="h-6 w-6 mr-2" />
                                    <span className="font-medium">Repartidor</span>
                                </button>
                            </div>
                            <input type="hidden" name="role" value={role} />
                        </div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        {/* Role Specific Fields */}
                        {role === 'restaurant' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detalles del Restaurante</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Restaurante</label>
                                    <input
                                        type="text"
                                        name="restaurantName"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>
                        )}

                        {role === 'delivery_agent' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detalles del Vehículo</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Vehículo</label>
                                    <select
                                        name="vehicleType"
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                    >
                                        <option value="motocicleta">Motocicleta</option>
                                        <option value="bicicleta">Bicicleta</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Feedback Messages */}
                        {state.message && (
                            <div className={`rounded-md p-4 ${state.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        {state.success ? (
                                            <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${state.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                            {state.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <>
                                        <LoadingSpinner isLoading={true} className="h-4 w-4 mr-2" />
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Perfil'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
