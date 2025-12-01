'use client';

import { useEffect, useRef, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { completeTour } from '@/actions/tourActions';
import { useRouter } from 'next/navigation';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

interface DashboardTourProps {
    hasSeenTour: boolean;
    userName: string;
}

export default function DashboardTour({ hasSeenTour, userName }: DashboardTourProps) {
    const router = useRouter();
    const driverObj = useRef<ReturnType<typeof driver>>(null);
    const [showModal, setShowModal] = useState(false);
    const [startTour, setStartTour] = useState(false);

    useEffect(() => {
        // If user hasn't seen tour, start with the modal
        if (!hasSeenTour) {
            setShowModal(true);
        }
    }, [hasSeenTour]);

    const handleModalClose = () => {
        setShowModal(false);
        // Start tour after modal closes
        setStartTour(true);
    };

    useEffect(() => {
        if (!startTour) return;

        // Initialize driver
        driverObj.current = driver({
            showProgress: true,
            animate: true,
            allowClose: false,
            doneBtnText: '¡Entendido!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            progressText: 'Paso {{current}} de {{total}}',
            steps: [
                {
                    element: '#dashboard-welcome',
                    popover: {
                        title: '¡Bienvenido a tu Panel!',
                        description: 'Aquí podrás gestionar todo tu restaurante de manera fácil y rápida. Te daremos un tour rápido.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#dashboard-stats',
                    popover: {
                        title: 'Tus Métricas Clave',
                        description: 'Visualiza tus pedidos, ingresos y calificación en tiempo real. ¡Mantén el control de tu negocio!',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#dashboard-orders',
                    popover: {
                        title: 'Gestión de Pedidos',
                        description: 'Aquí aparecerán tus pedidos recientes. Podrás ver detalles y cambiar su estado.',
                        side: 'top',
                        align: 'start'
                    }
                }
            ],
            onDestroyStarted: async () => {
                if (!driverObj.current?.hasNextStep() || confirm('¿Quieres salir del tour?')) {
                    driverObj.current?.destroy();
                    await completeTour();
                    router.refresh();
                }
            },
        });

        // Start tour after a short delay to ensure rendering
        const timer = setTimeout(() => {
            driverObj.current?.drive();
        }, 500);

        return () => clearTimeout(timer);
    }, [startTour, router]);

    return (
        <OnboardingModal
            isOpen={showModal}
            onClose={handleModalClose}
            role="restaurant"
            userName={userName}
        />
    );
}
