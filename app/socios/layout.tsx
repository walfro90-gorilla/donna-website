import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Regístrate, prepara y gana 💵 | Doña Repartos',
    description: 'Únete a Doña Repartos como socio restaurante. Aumenta tus ventas y llega a más clientes en tu barrio.',
    openGraph: {
        title: 'Regístrate, prepara y gana 💵 | Doña Repartos',
        description: 'Únete a Doña Repartos como socio restaurante. Aumenta tus ventas y llega a más clientes en tu barrio.',
        url: 'https://doña.app/socios',
        images: ['/opengraph-image.png'],
    },
};

export default function SociosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
