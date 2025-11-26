
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Progress, Button } from '@/components/ui';
import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CompletionCardProps {
    percentage: number;
    missingFields: {
        key: string;
        label: string;
        href?: string;
    }[];
    role: 'restaurant' | 'delivery_agent';
    onFieldClick?: (fieldKey: string) => void;
}

export function CompletionCard({ percentage, missingFields, role, onFieldClick }: CompletionCardProps) {
    const isComplete = percentage === 100;

    return (
        <Card className="overflow-hidden border-none shadow-lg bg-card">
            <div className={cn("h-2 w-full", isComplete ? "bg-green-500" : "bg-[#e4007c]")} />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-foreground">
                        {isComplete ? '¡Perfil Completado!' : 'Completa tu Perfil'}
                    </CardTitle>
                    <span className={cn("text-sm font-bold px-2 py-1 rounded-full", isComplete ? "bg-green-100 text-green-700" : "bg-pink-100 text-[#e4007c]")}>
                        {percentage}%
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <Progress value={percentage} className="h-2 mb-4" />

                {isComplete ? (
                    <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <p className="text-sm font-medium">¡Todo listo! Tu perfil está optimizado.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-start text-amber-600 bg-amber-50 p-3 rounded-lg">
                            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">
                                Completa los siguientes campos para activar todas las funciones:
                            </p>
                        </div>
                        <ul className="space-y-2">
                            {missingFields.slice(0, 3).map((field) => (
                                <li key={field.key} className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-2 rounded hover:bg-muted transition-colors">
                                    <span>{field.label}</span>
                                    {onFieldClick ? (
                                        <button
                                            onClick={() => onFieldClick(field.key)}
                                            className="text-[#e4007c] hover:text-[#c00068]"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        field.href && (
                                            <Link href={field.href} className="text-[#e4007c] hover:text-[#c00068]">
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        )
                                    )}
                                </li>
                            ))}
                            {missingFields.length > 3 && (
                                <li className="text-xs text-center text-muted-foreground pt-1">
                                    y {missingFields.length - 3} más...
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </CardContent>
            {!isComplete && (
                <CardFooter>
                    <Button
                        onClick={() => onFieldClick ? onFieldClick('general') : null}
                        asChild={!onFieldClick}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {onFieldClick ? (
                            <span>Completar Perfil</span>
                        ) : (
                            <Link href={role === 'restaurant' ? '/restaurant/settings' : '/delivery_agent/profile'}>
                                Completar Perfil
                            </Link>
                        )}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
