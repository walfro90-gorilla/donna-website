// app/login/page.tsx
import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Doña Repartos',
  description: 'Inicia sesión en tu cuenta de Doña Repartos para acceder a tu panel de control y gestionar tus pedidos.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
