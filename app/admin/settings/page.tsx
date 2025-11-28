'use client';

import { useState } from 'react';
import { Settings, DollarSign, Percent, Clock } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        platformCommission: 15,
        deliveryFee: 30,
        minOrderAmount: 50,
        maxDeliveryRadius: 10,
    });

    const handleSave = () => {
        // TODO: Implement save to database
        alert('Configuración guardada (funcionalidad pendiente)');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-foreground">Configuración de la Plataforma</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Administra los parámetros globales de la plataforma.
                    </p>
                </div>
            </div>

            <div className="mt-8 space-y-6">
                {/* Commission Settings */}
                <div className="bg-card shadow sm:rounded-lg border border-border">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center mb-4">
                            <Percent className="h-5 w-5 text-muted-foreground mr-2" />
                            <h3 className="text-lg font-medium leading-6 text-foreground">
                                Comisión de la Plataforma
                            </h3>
                        </div>
                        <div className="mt-2 max-w-xl text-sm text-muted-foreground">
                            <p>Porcentaje de comisión cobrado a los restaurantes por cada pedido.</p>
                        </div>
                        <div className="mt-5 sm:flex sm:items-center">
                            <div className="w-full sm:max-w-xs">
                                <label htmlFor="commission" className="sr-only">
                                    Comisión
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <input
                                        type="number"
                                        name="commission"
                                        id="commission"
                                        className="block w-full rounded-md border-input pr-12 focus:border-[#e4007c] focus:ring-[#e4007c] sm:text-sm p-2 border bg-background text-foreground"
                                        value={settings.platformCommission}
                                        onChange={(e) => setSettings({ ...settings, platformCommission: Number(e.target.value) })}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-muted-foreground sm:text-sm">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Fee */}
                <div className="bg-card shadow sm:rounded-lg border border-border">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center mb-4">
                            <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                            <h3 className="text-lg font-medium leading-6 text-foreground">
                                Tarifa de Envío
                            </h3>
                        </div>
                        <div className="mt-2 max-w-xl text-sm text-muted-foreground">
                            <p>Costo de envío por defecto para los pedidos.</p>
                        </div>
                        <div className="mt-5 sm:flex sm:items-center">
                            <div className="w-full sm:max-w-xs">
                                <label htmlFor="deliveryFee" className="sr-only">
                                    Tarifa de envío
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-muted-foreground sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="deliveryFee"
                                        id="deliveryFee"
                                        className="block w-full rounded-md border-input pl-7 pr-12 focus:border-[#e4007c] focus:ring-[#e4007c] sm:text-sm p-2 border bg-background text-foreground"
                                        value={settings.deliveryFee}
                                        onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-muted-foreground sm:text-sm">MXN</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Min Order Amount */}
                <div className="bg-card shadow sm:rounded-lg border border-border">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center mb-4">
                            <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                            <h3 className="text-lg font-medium leading-6 text-foreground">
                                Monto Mínimo de Pedido
                            </h3>
                        </div>
                        <div className="mt-2 max-w-xl text-sm text-muted-foreground">
                            <p>Monto mínimo requerido para realizar un pedido.</p>
                        </div>
                        <div className="mt-5 sm:flex sm:items-center">
                            <div className="w-full sm:max-w-xs">
                                <label htmlFor="minOrder" className="sr-only">
                                    Monto mínimo
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-muted-foreground sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="minOrder"
                                        id="minOrder"
                                        className="block w-full rounded-md border-input pl-7 pr-12 focus:border-[#e4007c] focus:ring-[#e4007c] sm:text-sm p-2 border bg-background text-foreground"
                                        value={settings.minOrderAmount}
                                        onChange={(e) => setSettings({ ...settings, minOrderAmount: Number(e.target.value) })}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-muted-foreground sm:text-sm">MXN</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#e4007c] hover:bg-[#c00068] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c]"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
