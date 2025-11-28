import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Regístrate, reparte y gana 🛵 | Doña Repartos',
    description: 'Conviértete en repartidor de Doña Repartos. Gana dinero extra con horarios flexibles entregando en tu zona.',
    openGraph: {
        title: 'Regístrate, reparte y gana 🛵 | Doña Repartos',
        description: 'Conviértete en repartidor de Doña Repartos. Gana dinero extra con horarios flexibles entregando en tu zona.',
        url: 'https://doña.app/registro-repartidor',
        images: ['/opengraph-image.png'],
    },
};

export default function RegistroRepartidorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
