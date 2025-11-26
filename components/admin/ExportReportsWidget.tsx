
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Download, FileText, Calendar } from 'lucide-react';

type ReportType = 'orders' | 'restaurants' | 'couriers' | 'revenue';

export default function ExportReportsWidget() {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateOrdersReport = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          id,
          created_at,
          status,
          total_amount,
          payment_method,
          delivery_fee,
          restaurants (name),
          client:users!orders_user_id_fkey (name, email),
          courier:users!orders_delivery_agent_id_fkey (name)
        `)
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data?.map(order => ({
                ID: order.id,
                Fecha: new Date(order.created_at).toLocaleString('es-MX'),
                Restaurante: order.restaurants?.name || 'N/A',
                Cliente: order.client?.name || 'N/A',
                Email_Cliente: order.client?.email || 'N/A',
                Repartidor: order.courier?.name || 'Sin asignar',
                Estado: order.status,
                Total: order.total_amount,
                Tarifa_Envio: order.delivery_fee,
                Metodo_Pago: order.payment_method
            })) || [];

            exportToCSV(formattedData, 'reporte_pedidos');
        } catch (error) {
            console.error('Error generating orders report:', error);
            alert('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    const generateRestaurantsReport = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select(`
          id,
          name,
          status,
          created_at,
          average_rating,
          total_reviews,
          cuisine_type,
          users (email, phone)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data?.map(restaurant => ({
                ID: restaurant.id,
                Nombre: restaurant.name,
                Estado: restaurant.status,
                Fecha_Registro: new Date(restaurant.created_at).toLocaleDateString('es-MX'),
                Email: restaurant.users?.email || 'N/A',
                Telefono: restaurant.users?.phone || 'N/A',
                Tipo_Cocina: restaurant.cuisine_type || 'N/A',
                Rating: restaurant.average_rating || 0,
                Total_Resenas: restaurant.total_reviews || 0
            })) || [];

            exportToCSV(formattedData, 'reporte_restaurantes');
        } catch (error) {
            console.error('Error generating restaurants report:', error);
            alert('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    const generateCouriersReport = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('delivery_agent_profiles')
                .select(`
          user_id,
          status,
          vehicle_type,
          vehicle_plate,
          created_at,
          users (name, email, phone)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data?.map(courier => ({
                ID: courier.user_id,
                Nombre: courier.users?.name || 'N/A',
                Email: courier.users?.email || 'N/A',
                Telefono: courier.users?.phone || 'N/A',
                Estado: courier.status,
                Tipo_Vehiculo: courier.vehicle_type || 'N/A',
                Placa: courier.vehicle_plate || 'N/A',
                Fecha_Registro: new Date(courier.created_at).toLocaleDateString('es-MX')
            })) || [];

            exportToCSV(formattedData, 'reporte_repartidores');
        } catch (error) {
            console.error('Error generating couriers report:', error);
            alert('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    const generateRevenueReport = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('created_at, total_amount, delivery_fee, status, restaurants (name)')
                .eq('status', 'delivered')
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data?.map(order => {
                const subtotal = Number(order.total_amount) - Number(order.delivery_fee || 0);
                const commission = subtotal * 0.15; // 15% commission

                return {
                    Fecha: new Date(order.created_at).toLocaleDateString('es-MX'),
                    Restaurante: order.restaurants?.name || 'N/A',
                    Subtotal: subtotal.toFixed(2),
                    Tarifa_Envio: Number(order.delivery_fee || 0).toFixed(2),
                    Total: Number(order.total_amount).toFixed(2),
                    Comision_Plataforma: commission.toFixed(2),
                    Pago_Restaurante: (subtotal - commission).toFixed(2)
                };
            }) || [];

            exportToCSV(formattedData, 'reporte_ingresos');
        } catch (error) {
            console.error('Error generating revenue report:', error);
            alert('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    const reports = [
        {
            type: 'orders' as ReportType,
            title: 'Reporte de Pedidos',
            description: 'Exporta todos los pedidos con detalles completos',
            icon: FileText,
            action: generateOrdersReport
        },
        {
            type: 'restaurants' as ReportType,
            title: 'Reporte de Restaurantes',
            description: 'Lista completa de restaurantes registrados',
            icon: FileText,
            action: generateRestaurantsReport
        },
        {
            type: 'couriers' as ReportType,
            title: 'Reporte de Repartidores',
            description: 'Lista completa de repartidores',
            icon: FileText,
            action: generateCouriersReport
        },
        {
            type: 'revenue' as ReportType,
            title: 'Reporte de Ingresos',
            description: 'Análisis de ingresos y comisiones',
            icon: FileText,
            action: generateRevenueReport
        }
    ];

    return (
        <div className="bg-card shadow rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-medium text-foreground">Exportar Reportes</h3>
                    <p className="text-sm text-muted-foreground mt-1">Descarga reportes en formato CSV</p>
                </div>
                <Download className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Date Range Selector */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium text-foreground">Rango de Fechas</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Desde</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-[#e4007c] focus:border-[#e4007c] bg-background text-foreground"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Hasta</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-[#e4007c] focus:border-[#e4007c] bg-background text-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* Report Buttons */}
            <div className="grid grid-cols-1 gap-3">
                {reports.map((report) => (
                    <button
                        key={report.type}
                        onClick={report.action}
                        disabled={loading}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-[#e4007c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="flex items-center gap-3">
                            <report.icon className="h-5 w-5 text-muted-foreground group-hover:text-[#e4007c]" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-foreground">{report.title}</p>
                                <p className="text-xs text-muted-foreground">{report.description}</p>
                            </div>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-[#e4007c]" />
                    </button>
                ))}
            </div>

            {loading && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Generando reporte...
                </div>
            )}
        </div>
    );
}
