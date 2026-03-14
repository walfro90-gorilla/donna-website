'use client';

import { useEffect, useRef, useState } from 'react';
import {
    MapPin, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
    X, Check, AlertTriangle, Loader2, Map
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export interface CoverageZone {
    id: string;
    name: string;
    center_lat: number;
    center_lon: number;
    radius_km: number;
    is_active: boolean;
    created_at: string;
}

declare global {
    interface Window { google: any; }
}

// Default center: Culiacán, Sinaloa
const DEFAULT_LAT = 24.8049;
const DEFAULT_LNG = -107.3940;

// ─── Map picker component ────────────────────────────────────────────────────
function MapPicker({
    lat, lng, radiusKm, onLocationChange,
}: {
    lat: number; lng: number; radiusKm: number;
    onLocationChange: (lat: number, lng: number) => void;
}) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Load Google Maps script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        const checkReady = () => {
            if (window.google?.maps?.Map) { setMapLoaded(true); return true; }
            return false;
        };
        if (checkReady()) return;

        const existing = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existing) {
            const interval = setInterval(() => { if (checkReady()) clearInterval(interval); }, 100);
            return () => clearInterval(interval);
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setTimeout(() => checkReady(), 100);
        document.head.appendChild(script);
    }, []);

    // Init map
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;
        if (mapInstanceRef.current) return; // already initialized

        const center = { lat, lng };
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 13,
            mapTypeId: 'roadmap',
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
        });

        markerRef.current = new window.google.maps.Marker({
            position: center,
            map: mapInstanceRef.current,
            draggable: true,
            title: 'Centro de la zona',
        });

        circleRef.current = new window.google.maps.Circle({
            map: mapInstanceRef.current,
            center,
            radius: radiusKm * 1000,
            fillColor: '#e4007c',
            fillOpacity: 0.15,
            strokeColor: '#e4007c',
            strokeOpacity: 0.6,
            strokeWeight: 2,
        });

        markerRef.current.addListener('dragend', (e: any) => {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            circleRef.current?.setCenter({ lat: newLat, lng: newLng });
            onLocationChange(newLat, newLng);
        });

        // Click on map to move marker
        mapInstanceRef.current.addListener('click', (e: any) => {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            markerRef.current?.setPosition({ lat: newLat, lng: newLng });
            circleRef.current?.setCenter({ lat: newLat, lng: newLng });
            onLocationChange(newLat, newLng);
        });
    }, [mapLoaded]);

    // Sync marker + circle when lat/lng changes externally
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const pos = { lat, lng };
        markerRef.current?.setPosition(pos);
        circleRef.current?.setCenter(pos);
        mapInstanceRef.current.panTo(pos);
    }, [lat, lng]);

    // Sync circle radius
    useEffect(() => {
        circleRef.current?.setRadius(radiusKm * 1000);
    }, [radiusKm]);

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="h-48 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para ver el mapa
            </div>
        );
    }

    return (
        <div className="relative">
            <div ref={mapRef} className="h-64 w-full rounded-lg border border-gray-200 dark:border-gray-700" />
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Loader2 className="h-6 w-6 animate-spin text-[#e4007c]" />
                </div>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Haz clic en el mapa o arrastra el pin para posicionar el centro de la zona.
            </p>
        </div>
    );
}

// ─── Coverage map monitor ─────────────────────────────────────────────────────
function CoverageMapMonitor({ zones }: { zones: CoverageZone[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const overlaysRef = useRef<any[]>([]);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Load Google Maps script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        const checkReady = () => {
            if (window.google?.maps?.Map) { setMapLoaded(true); return true; }
            return false;
        };
        if (checkReady()) return;

        const existing = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existing) {
            const interval = setInterval(() => { if (checkReady()) clearInterval(interval); }, 100);
            return () => clearInterval(interval);
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setTimeout(() => checkReady(), 100);
        document.head.appendChild(script);
    }, []);

    // Init map
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            zoom: 12,
            center: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
            mapTypeId: 'roadmap',
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
        });
    }, [mapLoaded]);

    // Draw / redraw all zones whenever zones or map changes
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current) return;

        // Remove previous overlays
        overlaysRef.current.forEach(o => o.setMap(null));
        overlaysRef.current = [];

        if (zones.length === 0) return;

        const bounds = new window.google.maps.LatLngBounds();

        zones.forEach(zone => {
            const center = { lat: zone.center_lat, lng: zone.center_lon };
            const color = zone.is_active ? '#e4007c' : '#9ca3af';
            const opacity = zone.is_active ? 1 : 0.5;

            const circle = new window.google.maps.Circle({
                map: mapInstanceRef.current,
                center,
                radius: zone.radius_km * 1000,
                fillColor: color,
                fillOpacity: zone.is_active ? 0.12 : 0.06,
                strokeColor: color,
                strokeOpacity: opacity,
                strokeWeight: zone.is_active ? 2 : 1.5,
            });

            const marker = new window.google.maps.Marker({
                position: center,
                map: mapInstanceRef.current,
                title: zone.name,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: color,
                    fillOpacity: opacity,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                },
            });

            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="font-family:sans-serif;min-width:140px">
                        <div style="font-weight:600;font-size:13px;color:#111">${zone.name}</div>
                        <div style="font-size:11px;color:#666;margin-top:3px">Radio: ${zone.radius_km.toFixed(1)} km</div>
                        <div style="font-size:11px;margin-top:2px;color:${zone.is_active ? '#16a34a' : '#9ca3af'};font-weight:500">
                            ${zone.is_active ? '● Activa' : '○ Inactiva'}
                        </div>
                    </div>`,
            });

            marker.addListener('click', () => {
                infoWindow.open(mapInstanceRef.current, marker);
            });

            bounds.extend(center);
            overlaysRef.current.push(circle, marker);
        });

        mapInstanceRef.current.fitBounds(bounds, 60);
    }, [mapLoaded, zones]);

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return null;

    return (
        <div className="mt-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-[#e4007c]" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mapa de Cobertura</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#e4007c]" /> Activa
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" /> Inactiva
                    </span>
                </div>
            </div>
            <div className="relative">
                <div ref={mapRef} className="h-80 w-full" />
                {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <Loader2 className="h-7 w-7 animate-spin text-[#e4007c]" />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Form modal ──────────────────────────────────────────────────────────────
function ZoneFormModal({
    zone, onClose, onSaved,
}: {
    zone: CoverageZone | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(zone?.name ?? '');
    const [lat, setLat] = useState(zone?.center_lat ?? DEFAULT_LAT);
    const [lng, setLng] = useState(zone?.center_lon ?? DEFAULT_LNG);
    const [radiusKm, setRadiusKm] = useState(zone?.radius_km ?? 2.0);
    const [isActive, setIsActive] = useState(zone?.is_active ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMapLocation = (newLat: number, newLng: number) => {
        setLat(parseFloat(newLat.toFixed(6)));
        setLng(parseFloat(newLng.toFixed(6)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (lat < -90 || lat > 90) { setError('Latitud inválida (debe estar entre -90 y 90)'); return; }
        if (lng < -180 || lng > 180) { setError('Longitud inválida (debe estar entre -180 y 180)'); return; }
        if (radiusKm <= 0 || radiusKm > 50) { setError('Radio inválido (debe estar entre 0.1 y 50 km)'); return; }
        setSaving(true);

        const payload = { name: name.trim(), center_lat: lat, center_lon: lng, radius_km: radiusKm, is_active: isActive };
        const { error: err } = zone
            ? await supabase.from('coverage_zones').update(payload).eq('id', zone.id)
            : await supabase.from('coverage_zones').insert([payload]);

        setSaving(false);
        if (err) { setError(err.message); return; }
        onSaved();
    };

    const inputClass = "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-transparent";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[#e4007c]" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {zone ? 'Editar Zona' : 'Nueva Zona de Cobertura'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Nombre de la zona <span className="text-[#e4007c]">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="ej. Colonia Oasis"
                            className={inputClass}
                        />
                    </div>

                    {/* Map */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Posición del centro
                        </label>
                        <MapPicker lat={lat} lng={lng} radiusKm={radiusKm} onLocationChange={handleMapLocation} />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Latitud <span className="text-[#e4007c]">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                step="any"
                                min={-90}
                                max={90}
                                value={lat}
                                onChange={e => setLat(parseFloat(e.target.value) || 0)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Longitud <span className="text-[#e4007c]">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                step="any"
                                min={-180}
                                max={180}
                                value={lng}
                                onChange={e => setLng(parseFloat(e.target.value) || 0)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Radius */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Radio de cobertura (km) <span className="text-[#e4007c]">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                required
                                step="0.1"
                                min={0.1}
                                max={50}
                                value={radiusKm}
                                onChange={e => setRadiusKm(parseFloat(e.target.value) || 0.1)}
                                className={`${inputClass} max-w-[160px]`}
                            />
                            <input
                                type="range"
                                min={0.1}
                                max={20}
                                step={0.1}
                                value={Math.min(radiusKm, 20)}
                                onChange={e => setRadiusKm(parseFloat(e.target.value))}
                                className="flex-1 accent-[#e4007c]"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400 w-14 text-right">
                                {radiusKm.toFixed(1)} km
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">Máximo permitido: 50 km</p>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Zona activa</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Las zonas inactivas no reciben pedidos</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-[#e4007c]' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#e4007c] rounded-md hover:bg-[#c0006a] disabled:opacity-60 transition-colors"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            {zone ? 'Guardar cambios' : 'Crear zona'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({
    zone, onClose, onDeleted,
}: {
    zone: CoverageZone;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase.from('coverage_zones').delete().eq('id', zone.id);
        setDeleting(false);
        if (error) { alert('Error: ' + error.message); return; }
        onDeleted();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Eliminar zona de cobertura</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Vas a eliminar <span className="font-medium text-gray-900 dark:text-white">"{zone.name}"</span>.
                        </p>
                        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <div className="flex gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    Eliminar esta zona detendrá inmediatamente la recepción de pedidos en esta área.
                                    Alternativamente, puedes simplemente <strong>desactivarla</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Eliminar zona
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CoverageZonesPage() {
    const [zones, setZones] = useState<CoverageZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [editZone, setEditZone] = useState<CoverageZone | null | 'new'>('new' as any);
    const [showForm, setShowForm] = useState(false);
    const [deleteZone, setDeleteZone] = useState<CoverageZone | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchZones = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coverage_zones')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error('Error fetching coverage zones:', error);
        setZones((data as CoverageZone[]) ?? []);
        setLoading(false);
    };

    useEffect(() => { fetchZones(); }, []);

    const handleToggle = async (zone: CoverageZone) => {
        setTogglingId(zone.id);
        const { error } = await supabase
            .from('coverage_zones')
            .update({ is_active: !zone.is_active })
            .eq('id', zone.id);
        if (error) { alert('Error: ' + error.message); }
        else { setZones(prev => prev.map(z => z.id === zone.id ? { ...z, is_active: !zone.is_active } : z)); }
        setTogglingId(null);
    };

    const openCreate = () => { setEditZone(null); setShowForm(true); };
    const openEdit = (zone: CoverageZone) => { setEditZone(zone); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditZone(null); };
    const handleSaved = () => { closeForm(); fetchZones(); };
    const handleDeleted = () => { setDeleteZone(null); fetchZones(); };

    const activeCount = zones.filter(z => z.is_active).length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:flex-auto">
                    <div className="flex items-center gap-2">
                        <Map className="h-6 w-6 text-[#e4007c]" />
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Zonas de Cobertura</h1>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Gestiona las geocercas que definen dónde se aceptan pedidos y registros.
                        {!loading && (
                            <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                                {activeCount} activa{activeCount !== 1 ? 's' : ''} · {zones.length} total
                            </span>
                        )}
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#e4007c] rounded-md hover:bg-[#c0006a] transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva zona
                    </button>
                </div>
            </div>

            {/* Info banner */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium">Motor de Geofencing activo</p>
                        <p className="mt-0.5 text-blue-600 dark:text-blue-400">
                            La función <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded text-xs">check_location_coverage</code> de Supabase
                            valida cada coordenada contra estas zonas usando la fórmula de Haversine. Solo las zonas con estado <strong>Activo</strong> se evalúan.
                        </p>
                    </div>
                </div>
            </div>

            {/* Map monitor */}
            {!loading && zones.length > 0 && (
                <CoverageMapMonitor zones={zones} />
            )}

            {/* Table */}
            <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sm:pl-6">Zona</th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coordenadas</th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Radio</th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <div className="flex justify-center items-center gap-2 text-gray-400">
                                        <Loader2 className="h-5 w-5 animate-spin text-[#e4007c]" />
                                        Cargando zonas...
                                    </div>
                                </td>
                            </tr>
                        ) : zones.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center">
                                    <MapPin className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay zonas de cobertura configuradas</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Crea la primera zona para habilitar el geofencing</p>
                                    <button
                                        onClick={openCreate}
                                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#e4007c] rounded-md hover:bg-[#c0006a] transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Crear primera zona
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            zones.map(zone => (
                                <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    {/* Name */}
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${zone.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{zone.name}</div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(zone.created_at).toLocaleDateString('es-MX')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Coordinates */}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-mono">
                                        <div className="text-gray-700 dark:text-gray-300">{zone.center_lat.toFixed(5)}</div>
                                        <div className="text-gray-500 dark:text-gray-500">{zone.center_lon.toFixed(5)}</div>
                                    </td>

                                    {/* Radius */}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className="h-4 rounded-full bg-[#e4007c]/20 border border-[#e4007c]/40"
                                                style={{ width: `${Math.min(zone.radius_km * 4, 80)}px` }}
                                            />
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                {zone.radius_km.toFixed(1)} km
                                            </span>
                                        </div>
                                    </td>

                                    {/* Toggle */}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <button
                                            onClick={() => handleToggle(zone)}
                                            disabled={togglingId === zone.id}
                                            className="flex items-center gap-2 transition-colors disabled:opacity-50"
                                            title={zone.is_active ? 'Desactivar zona' : 'Activar zona'}
                                        >
                                            {togglingId === zone.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                            ) : zone.is_active ? (
                                                <ToggleRight className="h-6 w-6 text-green-500" />
                                            ) : (
                                                <ToggleLeft className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                                            )}
                                            <span className={`text-xs font-semibold ${zone.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                {zone.is_active ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </button>
                                    </td>

                                    {/* Actions */}
                                    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm sm:pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(zone)}
                                                className="p-1.5 text-gray-400 hover:text-[#e4007c] hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-colors"
                                                title="Editar zona"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteZone(zone)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                title="Eliminar zona"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showForm && (
                <ZoneFormModal
                    zone={editZone as CoverageZone | null}
                    onClose={closeForm}
                    onSaved={handleSaved}
                />
            )}
            {deleteZone && (
                <DeleteModal
                    zone={deleteZone}
                    onClose={() => setDeleteZone(null)}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    );
}
