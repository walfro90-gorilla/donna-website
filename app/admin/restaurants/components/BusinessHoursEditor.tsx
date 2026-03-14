'use client';

import { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateRestaurantSchedule } from '../actions';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type DaySchedule = { enabled: boolean; open: string; close: string };
export type BusinessHours = Record<DayKey, DaySchedule>;

const DAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DayKey, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

const DEFAULT_DAY: DaySchedule = { enabled: false, open: '09:00', close: '21:00' };

function buildInitialHours(raw: BusinessHours | null): BusinessHours {
    const result = {} as BusinessHours;
    for (const day of DAYS) {
        result[day] = raw?.[day] ?? { ...DEFAULT_DAY };
    }
    return result;
}

interface Props {
    restaurantId: string;
    initialHours: BusinessHours | null;
    initialEnabled: boolean;
    timezone: string;
    onSaved: (hours: BusinessHours, enabled: boolean) => void;
}

export function BusinessHoursEditor({ restaurantId, initialHours, initialEnabled, timezone, onSaved }: Props) {
    const [hours, setHours] = useState<BusinessHours>(() => buildInitialHours(initialHours));
    const [autoEnabled, setAutoEnabled] = useState(initialEnabled);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);

    const updateDay = (day: DayKey, field: keyof DaySchedule, value: string | boolean) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateRestaurantSchedule(restaurantId, {
                business_hours: hours,
                business_hours_enabled: autoEnabled,
            });
            if (error) {
                console.error('[BusinessHoursEditor] save error:', error);
                toast.error('Error: ' + error);
                return;
            }
            setSavedAt(new Date());
            toast.success('Horarios actualizados');
            onSaved(hours, autoEnabled);
        } catch (e) {
            console.error('[BusinessHoursEditor] unexpected error:', e);
            toast.error('Error inesperado al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* Card Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-[#e4007c]" />
                    Horarios de Atención
                </h3>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-5">

                {/* Auto-schedule toggle */}
                <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                    autoEnabled
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'
                }`}>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Horario automático (cron)
                        </p>
                        <p className={`text-sm mt-0.5 ${autoEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            {autoEnabled
                                ? `⏱ Abre/cierra cada 5 min · ${timezone}`
                                : '✋ Control manual — el cron ignora este restaurante'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAutoEnabled(v => !v)}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            autoEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        aria-label="Toggle horario automático"
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${autoEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Day rows */}
                <div className="space-y-1.5">
                    {DAYS.map(day => {
                        const sched = hours[day];
                        return (
                            <div
                                key={day}
                                className={`flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 py-3 px-3 rounded-xl border transition-colors ${
                                    sched.enabled
                                        ? 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                                        : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800'
                                }`}
                            >
                                {/* Row 1 (mobile) / single row (desktop): checkbox + label + closed badge */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={sched.enabled}
                                        onChange={e => updateDay(day, 'enabled', e.target.checked)}
                                        className="h-5 w-5 shrink-0 rounded border-gray-400 dark:border-gray-500 text-[#e4007c] focus:ring-[#e4007c]"
                                    />
                                    <span className={`w-24 text-sm font-semibold shrink-0 ${
                                        sched.enabled
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                        {DAY_LABELS[day]}
                                    </span>
                                    {!sched.enabled && (
                                        <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
                                            Cerrado
                                        </span>
                                    )}
                                </div>

                                {/* Row 2 (mobile) / continuation (desktop): time inputs */}
                                {sched.enabled && (
                                    <div className="flex items-center gap-2 pl-8 sm:pl-0">
                                        <input
                                            type="time"
                                            value={sched.open}
                                            onChange={e => updateDay(day, 'open', e.target.value)}
                                            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] w-full sm:w-28"
                                        />
                                        <span className="text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">—</span>
                                        <input
                                            type="time"
                                            value={sched.close}
                                            onChange={e => updateDay(day, 'close', e.target.value)}
                                            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] w-full sm:w-28"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Save row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {savedAt && !saving && (
                        <span className="text-sm text-green-600 dark:text-green-400 text-center sm:text-left">
                            ✓ Guardado a las {savedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#e4007c] hover:bg-[#c20069] active:bg-[#a30058] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c] disabled:opacity-50 transition-colors"
                    >
                        {saving && <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />}
                        {saving ? 'Guardando...' : 'Guardar horarios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
