'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui';
import { Button } from '@/components/ui';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: 'restaurant' | 'delivery_agent';
    userName?: string;
}

export function OnboardingModal({ isOpen, onClose, role, userName }: OnboardingModalProps) {
    const [open, setOpen] = useState(isOpen);

    useEffect(() => {
        setOpen(isOpen);
        if (isOpen) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const handleClose = () => {
        setOpen(false);
        onClose();
    };

    const content = {
        restaurant: {
            title: '¡Bienvenido a Doña Repartos!',
            description: `Hola ${userName || 'Socio'}, estamos emocionados de tenerte aquí. Tu panel de control está listo para ayudarte a gestionar tus pedidos, menú y ganancias.`,
            steps: [
                'Completa tu perfil y sube tu menú.',
                'Configura tus horarios de atención.',
                'Empieza a recibir pedidos y haz crecer tu negocio.'
            ]
        },
        delivery_agent: {
            title: '¡Bienvenido al equipo!',
            description: `Hola ${userName || 'Repartidor'}, gracias por unirte a la flota de Doña Repartos. Estás a pocos pasos de empezar a generar ingresos.`,
            steps: [
                'Sube tus documentos para verificación.',
                'Configura tu vehículo.',
                'Actívate y empieza a repartir.'
            ]
        }
    };

    const currentContent = content[role];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-0 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-500"></div>
                <DialogHeader className="pt-8 px-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 mb-6 shadow-sm animate-bounce-slow">
                        <CheckCircle2 className="h-8 w-8 text-green-500" aria-hidden="true" />
                    </div>
                    <DialogTitle className="text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {currentContent.title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500 dark:text-gray-400 mt-3 text-lg leading-relaxed">
                        {currentContent.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-8 space-y-6 px-6">
                    {currentContent.steps.map((step, index) => (
                        <div key={index} className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 transition-transform hover:scale-[1.02]">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm mr-4">
                                {index + 1}
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{step}</p>
                        </div>
                    ))}
                </div>

                <DialogFooter className="mt-8 pb-8 px-6 sm:justify-center">
                    <Button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-primary-hover hover:to-pink-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-primary/25 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex items-center justify-center text-lg"
                    >
                        Comenzar
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
