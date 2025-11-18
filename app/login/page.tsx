// app/login/page.tsx
import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Doña Repartos',
  description: 'Inicia sesión en tu cuenta de Doña Repartos para acceder a tu panel de control y gestionar tus pedidos.',
};

export default function LoginPage() {
  return <LoginForm />;
}
