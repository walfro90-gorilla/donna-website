'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { updateCourierStatus, updateCourierProfile } from '../actions';
import {
    ChevronLeft, User, Phone, Mail, Bike, Car, Footprints,
    FileText, CheckCircle, XCircle, PauseCircle, UserX,
    RotateCcw, DollarSign, MapPin, Star, AlertTriangle,
    Clock, Package, ShieldCheck, Image as ImageIcon, Edit, X, Loader2
} from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

type CourierStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'inactive';

interface CourierDetail {
    user_id: string;
    status: CourierStatus;
    account_state: string | null;
    profile_image_url: string | null;
    id_document_front_url: string | null;
    id_document_back_url: string | null;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    vehicle_model: string | null;
    vehicle_color: string | null;
    vehicle_registration_url: string | null;
    vehicle_insurance_url: string | null;
    vehicle_photo_url: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    onboarding_completed: boolean;
    onboarding_completed_at: string | null;
    created_at: string;
    updated_at: string;
    users: { name: string | null; email: string | null; phone: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado',
    suspended: 'Suspendido', inactive: 'Inactivo',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const VEHICLE_ICONS: Record<string, React.ReactNode> = {
    bicicleta: <Bike className="h-5 w-5" />,
    motocicleta: <Bike className="h-5 w-5" />,
    auto: <Car className="h-5 w-5" />,
    pie: <Footprints className="h-5 w-5" />,
    otro: <Bike className="h-5 w-5" />,
};

function DocItem({ label, url }: { label: string; url: string | null }) {
    return (
        <li className="flex items-center justify-between py-3 px-5">
            <div className="flex items-center gap-2">
                {url ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#e4007c] hover:underline font-medium">
                    Ver documento
                </a>
            ) : (
                <span className="text-xs text-red-400">Faltante</span>
            )}
        </li>
    );
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
            ))}
        </div>
    );
}

export default function CourierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [courier, setCourier] = useState<CourierDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [accountBalance, setAccountBalance] = useState(0);
    const [deliveredCount, setDeliveredCount] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [lastLocation, setLastLocation] = useState<{ lat: number; lon: number; last_seen_at: string } | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState<number | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', emergency_contact_name: '', emergency_contact_phone: '', vehicle_plate: '', vehicle_model: '', vehicle_color: '' });
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        fetchAll();
    }, [id]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Main profile
            const { data: profileData, error: profileError } = await supabase
                .from('delivery_agent_profiles')
                .select(`
                    *,
                    users:user_id (name, email, phone)
                `)
                .eq('user_id', id)
                .single();

            if (profileError) throw profileError;
            setCourier(profileData as CourierDetail);
            setEditForm({
                name: profileData.users?.name || '',
                phone: profileData.users?.phone || '',
                emergency_contact_name: profileData.emergency_contact_name || '',
                emergency_contact_phone: profileData.emergency_contact_phone || '',
                vehicle_plate: profileData.vehicle_plate || '',
                vehicle_model: profileData.vehicle_model || '',
                vehicle_color: profileData.vehicle_color || '',
            });

            // Account balance
            const { data: accountData } = await supabase
                .from('accounts')
                .select('balance')
                .eq('user_id', id)
                .eq('account_type', 'delivery_agent')
                .single();
            setAccountBalance(accountData?.balance || 0);

            // Delivered orders count + earnings
            const { data: ordersData } = await supabase
                .from('orders')
                .select('id, total_amount, delivery_fee, status, created_at, restaurant_id')
                .eq('delivery_agent_id', id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (ordersData) {
                const delivered = ordersData.filter(o => o.status === 'delivered');
                setDeliveredCount(delivered.length);
                setTotalEarnings(delivered.reduce((sum, o) => sum + (o.delivery_fee || 0), 0));
                setRecentOrders(ordersData.slice(0, 5));
            }

            // Last location
            const { data: locationData } = await supabase
                .from('courier_locations_latest')
                .select('lat, lon, last_seen_at')
                .eq('user_id', id)
                .single();
            if (locationData) setLastLocation(locationData);

            // Reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('rating, comment, created_at')
                .eq('subject_user_id', id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (reviewsData && reviewsData.length > 0) {
                setReviews(reviewsData);
                const avg = reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length;
                setAvgRating(Math.round(avg * 10) / 10);
            }

        } catch (error) {
            console.error('Error fetching courier details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: CourierStatus) => {
        const labels: Record<string, string> = {
            approved: 'aprobar', rejected: 'rechazar', suspended: 'suspender',
            inactive: 'dar de baja a', pending: 'reconsiderar',
        };
        if (!confirm(`¿Confirmas ${labels[newStatus] || 'cambiar el estado de'} este repartidor?`)) return;

        const { error } = await updateCourierStatus(id, newStatus);
        if (error) {
            alert(`Error al actualizar el estado: ${error}`);
            return;
        }
        setCourier(prev => prev ? { ...prev, status: newStatus } : prev);
    };

    const handleSaveProfile = async () => {
        setSavingEdit(true);
        const { error } = await updateCourierProfile(id, editForm);
        setSavingEdit(false);
        if (error) { alert('Error: ' + error); return; }
        setShowEditModal(false);
        fetchAll();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `hace ${mins} min`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `hace ${hrs}h`;
        return `hace ${Math.floor(hrs / 24)}d`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e4007c]" />
            </div>
        );
    }

    if (!courier) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Repartidor no encontrado</h2>
                <Link href="/admin/couriers" className="text-[#e4007c] hover:underline mt-4 inline-block">
                    Volver a la lista
                </Link>
            </div>
        );
    }

    const { status } = courier;

    return (
        <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/couriers"
                    className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors w-fit">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver a Repartidores
                </Link>

                <div className="sm:flex sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {courier.profile_image_url ? (
                                <OptimizedImage src={courier.profile_image_url} alt="Foto" className="h-full w-full object-cover" priority />
                            ) : (
                                <Bike className="h-8 w-8 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {courier.users?.name || 'Sin nombre'}
                            </h1>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                                    {STATUS_LABELS[status]}
                                </span>
                                {courier.account_state && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        Cuenta: {courier.account_state}
                                    </span>
                                )}
                                <span className="text-xs text-gray-400">
                                    Registrado el {formatDate(courier.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 flex-shrink-0">
                        {/* Edit Profile Button */}
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <Edit className="-ml-0.5 mr-1.5 h-4 w-4" />
                            Editar Perfil
                        </button>

                        {status === 'pending' && (
                            <>
                                <button onClick={() => handleStatusUpdate('rejected')}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
                                    <XCircle className="-ml-0.5 mr-1.5 h-4 w-4 text-red-500" />
                                    Rechazar
                                </button>
                                <button onClick={() => handleStatusUpdate('approved')}
                                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#e4007c] hover:bg-[#c00068] focus:outline-none">
                                    <CheckCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
                                    Aprobar
                                </button>
                            </>
                        )}
                        {status === 'approved' && (
                            <>
                                <button onClick={() => handleStatusUpdate('suspended')}
                                    className="inline-flex items-center px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-md text-sm font-medium text-orange-700 dark:text-orange-400 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 focus:outline-none">
                                    <PauseCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
                                    Suspender
                                </button>
                                <button onClick={() => handleStatusUpdate('inactive')}
                                    className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-700 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 focus:outline-none">
                                    <UserX className="-ml-0.5 mr-1.5 h-4 w-4" />
                                    Dar de baja
                                </button>
                            </>
                        )}
                        {status === 'suspended' && (
                            <>
                                <button onClick={() => handleStatusUpdate('approved')}
                                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#e4007c] hover:bg-[#c00068] focus:outline-none">
                                    <RotateCcw className="-ml-0.5 mr-1.5 h-4 w-4" />
                                    Reactivar
                                </button>
                                <button onClick={() => handleStatusUpdate('inactive')}
                                    className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-700 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 focus:outline-none">
                                    <UserX className="-ml-0.5 mr-1.5 h-4 w-4" />
                                    Dar de baja
                                </button>
                            </>
                        )}
                        {(status === 'rejected' || status === 'inactive') && (
                            <button onClick={() => handleStatusUpdate(status === 'rejected' ? 'pending' : 'approved')}
                                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#e4007c] hover:bg-[#c00068] focus:outline-none">
                                <RotateCcw className="-ml-0.5 mr-1.5 h-4 w-4" />
                                {status === 'rejected' ? 'Reconsiderar' : 'Reactivar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ─── Left column ─── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Personal info */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" /> Información Personal
                            </h3>
                        </div>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-5">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{courier.users?.email || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Teléfono</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{courier.users?.phone || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Registro</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(courier.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Onboarding</dt>
                                <dd className="mt-1 text-sm">
                                    {courier.onboarding_completed ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                            Completado {courier.onboarding_completed_at ? `· ${formatDate(courier.onboarding_completed_at)}` : ''}
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600 dark:text-yellow-400">En proceso</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Vehicle */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Bike className="h-4 w-4 text-gray-400" /> Vehículo
                            </h3>
                        </div>
                        <div className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</dt>
                                        <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-900 dark:text-white capitalize">
                                            {courier.vehicle_type ? (
                                                <>{VEHICLE_ICONS[courier.vehicle_type] || <Bike className="h-4 w-4" />} {courier.vehicle_type}</>
                                            ) : '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Placa</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{courier.vehicle_plate || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Modelo</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{courier.vehicle_model || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Color</dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{courier.vehicle_color || '—'}</dd>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Foto del vehículo</p>
                                    {courier.vehicle_photo_url ? (
                                        <a href={courier.vehicle_photo_url} target="_blank" rel="noopener noreferrer">
                                            <img src={courier.vehicle_photo_url} alt="Vehículo"
                                                className="w-full h-36 object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity" />
                                        </a>
                                    ) : (
                                        <div className="w-full h-36 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" /> Documentación
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            <DocItem label="Identificación — Frente" url={courier.id_document_front_url} />
                            <DocItem label="Identificación — Reverso" url={courier.id_document_back_url} />
                            <DocItem label="Tarjeta de Circulación" url={courier.vehicle_registration_url} />
                            <DocItem label="Póliza de Seguro" url={courier.vehicle_insurance_url} />
                        </ul>
                    </div>

                    {/* Recent orders */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" /> Pedidos Recientes
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/40">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {recentOrders.length > 0 ? recentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">#{order.id.slice(0, 8)}</td>
                                            <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">${order.total_amount?.toFixed(2)}</td>
                                            <td className="px-5 py-3 text-sm text-green-600 dark:text-green-400">${(order.delivery_fee || 0).toFixed(2)}</td>
                                            <td className="px-5 py-3 text-xs">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{formatDate(order.created_at)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400 italic">Sin pedidos registrados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* ─── Right column ─── */}
                <div className="space-y-6">

                    {/* Financial summary */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-500" /> Resumen Financiero
                            </h3>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Balance en cuenta</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ${accountBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Entregas completadas</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{deliveredCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ganancias totales</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                        ${totalEarnings.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency contact */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" /> Contacto de Emergencia
                            </h3>
                        </div>
                        <div className="px-6 py-5 space-y-2">
                            {courier.emergency_contact_name || courier.emergency_contact_phone ? (
                                <>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{courier.emergency_contact_name || '—'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{courier.emergency_contact_phone || '—'}</p>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                                    <AlertTriangle className="h-4 w-4" />
                                    No registrado
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Last location */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" /> Última Ubicación
                            </h3>
                        </div>
                        <div className="px-6 py-5">
                            {lastLocation ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                            Visto {timeAgo(lastLocation.last_seen_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                        {lastLocation.lat.toFixed(6)}, {lastLocation.lon.toFixed(6)}
                                    </p>
                                    <p className="text-xs text-gray-400">{formatDate(lastLocation.last_seen_at)}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Sin datos de ubicación</p>
                            )}
                        </div>
                    </div>

                    {/* Ratings */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Star className="h-4 w-4 text-gray-400" /> Calificaciones
                            </h3>
                        </div>
                        <div className="px-6 py-5">
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{avgRating}</span>
                                        {avgRating && <StarRating rating={avgRating} />}
                                        <span className="text-sm text-gray-400">({reviews.length} reseñas)</span>
                                    </div>
                                    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        {reviews.map((review, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <StarRating rating={review.rating} />
                                                    <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{review.comment}"</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Sin calificaciones aún</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Edit className="h-5 w-5 text-[#e4007c]" />
                                Editar Perfil
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Nombre', key: 'name' },
                                    { label: 'Teléfono', key: 'phone' },
                                    { label: 'Placa', key: 'vehicle_plate' },
                                    { label: 'Modelo', key: 'vehicle_model' },
                                    { label: 'Color', key: 'vehicle_color' },
                                ].map(({ label, key }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                                        <input
                                            type="text"
                                            value={(editForm as any)[key]}
                                            onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#e4007c] focus:border-[#e4007c]"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Contacto de Emergencia</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Nombre', key: 'emergency_contact_name' },
                                        { label: 'Teléfono', key: 'emergency_contact_phone' },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-400 mb-1">{label}</label>
                                            <input
                                                type="text"
                                                value={(editForm as any)[key]}
                                                onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#e4007c] focus:border-[#e4007c]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                Cancelar
                            </button>
                            <button onClick={handleSaveProfile} disabled={savingEdit}
                                className="px-4 py-2 text-sm bg-[#e4007c] hover:bg-[#c00068] text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
                                {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
                                {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
