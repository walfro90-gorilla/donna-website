'use client';

import { useEffect, useState } from 'react';
import { Settings, DollarSign, Percent, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings, type PlatformSettings } from './actions';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<PlatformSettings>({
        default_delivery_fee: 35,
        default_commission_bps: 1500,
        min_order_amount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getPlatformSettings().then(s => {
            setSettings(s);
            if (s.updated_at) setSavedAt(s.updated_at);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        const { error: err } = await updatePlatformSettings({
            default_delivery_fee: settings.default_delivery_fee,
            default_commission_bps: settings.default_commission_bps,
            min_order_amount: settings.min_order_amount,
        });
        setSaving(false);
        if (err) {
            setError(err);
        } else {
            setSavedAt(new Date().toISOString());
        }
    };

    const commissionPercent = (settings.default_commission_bps / 100).toFixed(1);

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando configuración...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center mb-8">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                        <Settings className="h-6 w-6 text-[#e4007c]" />
                        Configuración de la Plataforma
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Parámetros globales · Los cambios se aplican a nuevos pedidos y restaurantes.
                    </p>
                    {savedAt && (
                        <p className="mt-1 text-xs text-gray-400">
                            Última actualización: {new Date(savedAt).toLocaleString('es-MX')}
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Nota sobre la tabla */}
                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                        Asegúrate de haber creado la tabla <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">platform_settings</code> en Supabase.
                        Consulta el plan del proyecto para el SQL de migración.
                    </span>
                </div>

                {/* Comisión */}
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-5">
                        <div className="flex items-center mb-1">
                            <Percent className="h-5 w-5 text-[#e4007c] mr-2" />
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Comisión de la Plataforma</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Porcentaje cobrado a restaurantes por cada pedido completado.
                        </p>
                        <div className="flex items-end gap-4">
                            <div className="flex-1 max-w-xs">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Puntos base (bps)</label>
                                <div className="relative rounded-md shadow-sm">
                                    <input
                                        type="number"
                                        min="0" max="3000" step="50"
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 pr-12 focus:border-[#e4007c] focus:ring-[#e4007c] sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={settings.default_commission_bps}
                                        onChange={(e) => setSettings({ ...settings, default_commission_bps: Number(e.target.value) })}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">bps</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-lg font-bold text-[#e4007c] pb-2">= {commissionPercent}%</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">100 bps = 1%. Rango: 0–3000 bps (0–30%)</p>
                    </div>
                </div>

                {/* Tarifa de Envío */}
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-5">
                        <div className="flex items-center mb-1">
                            <DollarSign className="h-5 w-5 text-[#e4007c] mr-2" />
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Tarifa de Envío por Defecto</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Costo de envío por defecto para nuevos pedidos. Los restaurantes pueden tener su propia tarifa.
                        </p>
                        <div className="max-w-xs">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto (MXN)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    min="0" step="5"
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-7 pr-14 focus:border-[#e4007c] focus:ring-[#e4007c] sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settings.default_delivery_fee}
                                    onChange={(e) => setSettings({ ...settings, default_delivery_fee: Number(e.target.value) })}
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">MXN</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monto Mínimo */}
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-5">
                        <div className="flex items-center mb-1">
                            <DollarSign className="h-5 w-5 text-[#e4007c] mr-2" />
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monto Mínimo de Pedido</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Monto mínimo requerido para que un cliente pueda realizar un pedido.
                        </p>
                        <div className="max-w-xs">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto (MXN)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    min="0" step="10"
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-7 pr-14 focus:border-[#e4007c] focus:ring-[#e4007c] sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settings.min_order_amount}
                                    onChange={(e) => setSettings({ ...settings, min_order_amount: Number(e.target.value) })}
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">MXN</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save */}
                <div className="flex items-center justify-between py-4">
                    {savedAt && !error && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            Guardado correctamente
                        </div>
                    )}
                    <div className={savedAt && !error ? '' : 'ml-auto'}>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#e4007c] hover:bg-[#c00068] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
