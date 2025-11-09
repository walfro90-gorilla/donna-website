// components/PasswordStrength.tsx
"use client";

import { getPasswordStrength } from '@/lib/utils/validation';
import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export default function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return null;
    return getPasswordStrength(password);
  }, [password]);

  if (!password || password.length === 0) return null;

  const strengthConfig = {
    weak: {
      label: 'Débil',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      width: 'w-1/3',
    },
    medium: {
      label: 'Moderada',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      width: 'w-2/3',
    },
    strong: {
      label: 'Fuerte',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      width: 'w-full',
    },
  };

  const config = strength ? strengthConfig[strength] : null;

  if (!strength || !config) return null;

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${config.textColor}`}>
          Fuerza de contraseña: {config.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${config.color} ${config.width} h-2 rounded-full transition-all duration-300`}
          role="progressbar"
          aria-valuenow={strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Debe contener mayúsculas, minúsculas, números y mínimo 8 caracteres
      </p>
    </div>
  );
}

