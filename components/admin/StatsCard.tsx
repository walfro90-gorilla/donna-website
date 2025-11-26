
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
        <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-foreground">{value}</div>
                            </dd>
                            {subtext && <dd className="text-xs text-muted-foreground mt-1">{subtext}</dd>}
                            {trend && (
                                <dd className="flex items-center text-xs mt-1">
                                    <span className={trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                    </span>
                                    <span className="text-muted-foreground ml-1">vs mes anterior</span>
                                </dd>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
