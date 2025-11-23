interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    subtext?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function StatsCard({ title, value, icon: Icon, color, subtext, trend }: StatsCardProps) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">{value}</div>
                            </dd>
                            {subtext && <dd className="text-xs text-gray-400 mt-1">{subtext}</dd>}
                            {trend && (
                                <dd className="flex items-center text-xs mt-1">
                                    <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                    </span>
                                    <span className="text-gray-500 ml-1">vs mes anterior</span>
                                </dd>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
