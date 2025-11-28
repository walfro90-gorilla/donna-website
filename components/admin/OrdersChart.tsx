'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface OrdersChartProps {
    data: {
        name: string;
        value: number;
    }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function OrdersChart({ data }: OrdersChartProps) {
    return (
        <div className="bg-card border border-border p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estado de Pedidos</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                        <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: '#F3F4F6',
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
