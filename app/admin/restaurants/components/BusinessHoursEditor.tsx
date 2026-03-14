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

    const updateDay = (day: DayKey, field: keyof DaySchedule, value: string | boolean) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await updateRestaurantSchedule(restaurantId, {
            business_hours: hours,
            business_hours_enabled: autoEnabled,
        });
        setSaving(false);
        if (error) {
            toast.error('Error al guardar horarios: ' + error);
            return;
        }
        toast.success('Horarios actualizados');
        onSaved(hours, autoEnabled);
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-400" />
                    Horarios de Atención
                </h3>
            </div>

            <div className="px-6 py-5 space-y-6">
                {/* Auto-schedule toggle */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Horario automático (cron)
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {autoEnabled
                                ? `⏱ El cron abre/cierra la cocina cada 5 min · Zona: ${timezone}`
                                : '✋ Control manual — el cron ignora este restaurante'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAutoEnabled(v => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${autoEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${autoEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Day rows */}
                <div className="space-y-2">
                    {DAYS.map(day => {
                        const sched = hours[day];
                        return (
                            <div
                                key={day}
                                className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${sched.enabled ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}
                            >
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={sched.enabled}
                                    onChange={e => updateDay(day, 'enabled', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#e4007c] focus:ring-[#e4007c]"
                                />

                                {/* Day label */}
                                <span className={`w-24 text-sm font-medium ${sched.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {DAY_LABELS[day]}
                                </span>

                                {sched.enabled ? (
                                    <>
                                        <input
                                            type="time"
                                            value={sched.open}
                                            onChange={e => updateDay(day, 'open', e.target.value)}
                                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#e4007c] focus:border-[#e4007c] w-28"
                                        />
                                        <span className="text-gray-400 text-xs">—</span>
                                        <input
                                            type="time"
                                            value={sched.close}
                                            onChange={e => updateDay(day, 'close', e.target.value)}
                                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#e4007c] focus:border-[#e4007c] w-28"
                                        />
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                        Cerrado
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#e4007c] hover:bg-[#c00068] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c] disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {saving ? 'Guardando...' : 'Guardar horarios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
