'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
    data: {
        date: string;
        revenue: number;
    }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="bg-card border border-border p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ingresos Recientes</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                        <XAxis
                            dataKey="date"
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
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: '#F3F4F6',
                            }}
                            itemStyle={{ color: '#10B981' }}
                            formatter={(value: number) => [`$${value}`, 'Ingresos']}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10B981"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
