import React from 'react';

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    isCompleted: boolean;
    action: () => void;
}

interface DashboardHomeProps {
    agentName: string;
    checklistItems: ChecklistItem[];
    checklistCompletion: number;
}

export default function DashboardHome({ agentName, checklistItems, checklistCompletion }: DashboardHomeProps) {
    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hola, {agentName || 'Repartidor'} 🛵</h1>
                <p className="text-gray-500">Aquí tienes el resumen de tu actividad.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Earnings Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-400">Hoy</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Ganancias</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">$0.00</p>
                </div>

                {/* Deliveries Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-400">Hoy</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Entregas</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>

                {/* Rating Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-500">N/A</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Calificación</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">5.0</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checklist Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Tu progreso de activación</h2>
                                    <p className="text-sm text-gray-500 mt-1">Completa estos pasos para empezar a recibir pedidos</p>
                                </div>
                                <span className="text-2xl font-bold text-[#e4007c]">{checklistCompletion}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-[#e4007c] h-2.5 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${checklistCompletion}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {checklistItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={item.action}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`flex-shrink-0 ${item.isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                                            {item.isCompleted ? (
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={`font-medium ${item.isCompleted ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {item.label}
                                            </h3>
                                            <p className="text-sm text-gray-500">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-gray-400 group-hover:text-[#e4007c] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status / Notifications */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Estado de la Cuenta</h3>
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">Verificación Pendiente</p>
                                <p className="text-xs text-yellow-600">Estamos revisando tus documentos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
