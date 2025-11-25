
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold text-gray-900">
                        {currentContent.title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500 mt-2">
                        {currentContent.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {currentContent.steps.map((step, index) => (
                        <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border-2 border-[#e4007c] text-[#e4007c] font-bold text-xs mr-3">
                                {index + 1}
                            </div>
                            <p className="text-sm text-gray-700">{step}</p>
                        </div>
                    ))}
                </div>

                <DialogFooter className="mt-6 sm:justify-center">
                    <Button
                        onClick={handleClose}
                        className="w-full sm:w-auto bg-[#e4007c] hover:bg-[#c00068] text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center"
                    >
                        Comenzar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
