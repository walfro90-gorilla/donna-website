// components/registration/customer/AccountSecurityStep.tsx
"use client";

import { useState, useEffect } from 'react';
import { StepProps } from '@/components/forms/StepperForm';
import FormField from '@/components/FormField';
import PasswordStrength from '@/components/PasswordStrength';
import { Card, CardContent, Badge } from '@/components/ui';
import ErrorMessage from '@/components/ErrorMessage';
import { getPasswordStrength } from '@/lib/utils/validation';

interface SecurityData {
  password: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  marketingEmails: boolean;
  orderNotifications: boolean;
  promotionalSms: boolean;
  pushNotifications: boolean;
}

export default function AccountSecurityStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  errors,
}: StepProps) {
  const [formData, setFormData] = useState<SecurityData>({
    password: data.password || '',
    confirmPassword: data.confirmPassword || '',
    twoFactorEnabled: data.twoFactorEnabled ?? false,
    marketingEmails: data.marketingEmails ?? true,
    orderNotifications: data.orderNotifications ?? true,
    promotionalSms: data.promotionalSms ?? false,
    pushNotifications: data.pushNotifications ?? true,
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(getPasswordStrength(formData.password));
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, name, value, type, checked } = e.target;
    const fieldName = name || id;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [fieldName]: newValue }));
    
    // Clear local error when user starts typing
    if (localErrors[fieldName]) {
      setLocalErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (passwordStrength === 'weak') {
      newErrors.password = 'La contraseña es muy débil. Usa mayúsculas, minúsculas y números';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const canProceed = formData.password && 
                    formData.confirmPassword && 
                    formData.password === formData.confirmPassword &&
                    passwordStrength !== 'weak' &&
                    Object.keys(localErrors).length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Seguridad y Preferencias
        </h2>
        <p className="text-gray-600">
          Configura tu contraseña y preferencias de notificaciones
        </p>
      </div>

      {/* Password Section */}
      <Card variant="default">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Configuración de Contraseña
            </h3>
            
            {/* Password Field */}
            <div className="space-y-4">
              <div className="relative">
                <FormField
                  label="Contraseña"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Mínimo 8 caracteres"
                  error={localErrors.password || errors?.password}
                  helpText="Debe contener mayúsculas, minúsculas y números"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength */}
              <PasswordStrength password={formData.password} />

              {/* Confirm Password */}
              <FormField
                label="Confirmar Contraseña"
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Repite tu contraseña"
                error={localErrors.confirmPassword || errors?.confirmPassword}
              />
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="border-t pt-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="twoFactorEnabled"
                id="twoFactorEnabled"
                checked={formData.twoFactorEnabled}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="twoFactorEnabled" className="text-sm font-medium text-gray-900">
                  Habilitar autenticación de dos factores
                  <Badge variant="secondary" size="sm" className="ml-2">
                    Recomendado
                  </Badge>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Agrega una capa extra de seguridad enviando un código a tu teléfono cuando inicies sesión
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card variant="default">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Preferencias de Notificaciones
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Elige cómo quieres recibir actualizaciones sobre tus pedidos y ofertas especiales
          </p>

          <div className="space-y-4">
            {/* Order Notifications */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="orderNotifications"
                id="orderNotifications"
                checked={formData.orderNotifications}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="orderNotifications" className="text-sm font-medium text-gray-900">
                  Notificaciones de pedidos
                  <Badge variant="primary" size="sm" className="ml-2">
                    Esencial
                  </Badge>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Recibe actualizaciones sobre el estado de tus pedidos (confirmación, preparación, entrega)
                </p>
              </div>
            </div>

            {/* Push Notifications */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="pushNotifications"
                id="pushNotifications"
                checked={formData.pushNotifications}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="pushNotifications" className="text-sm font-medium text-gray-900">
                  Notificaciones push
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Recibe notificaciones instantáneas en tu dispositivo sobre tus pedidos
                </p>
              </div>
            </div>

            {/* Marketing Emails */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="marketingEmails"
                id="marketingEmails"
                checked={formData.marketingEmails}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="marketingEmails" className="text-sm font-medium text-gray-900">
                  Correos promocionales
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Recibe ofertas especiales, descuentos y noticias de tus restaurantes favoritos
                </p>
              </div>
            </div>

            {/* SMS Promotions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="promotionalSms"
                id="promotionalSms"
                checked={formData.promotionalSms}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="promotionalSms" className="text-sm font-medium text-gray-900">
                  SMS promocionales
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Recibe ofertas por tiempo limitado y códigos de descuento por SMS
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Nota de privacidad:</strong> Puedes cambiar estas preferencias en cualquier momento desde tu perfil. 
              Nunca compartimos tu información con terceros y puedes darte de baja cuando quieras.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card variant="default" className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.707-4.293c1.39-1.39 2.63-2.63 2.63-2.63s-1.24-1.24-2.63-2.63L9.707 3.293c-1.39 1.39-2.63 2.63-2.63 2.63s1.24 1.24 2.63 2.63L16.293 15.293z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-900 mb-2">
                Consejos de Seguridad
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Usa una contraseña única que no uses en otros sitios</li>
                <li>• Habilita la autenticación de dos factores para mayor seguridad</li>
                <li>• Nunca compartas tu contraseña con nadie</li>
                <li>• Cierra sesión en dispositivos compartidos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors?.general && <ErrorMessage message={errors.general} />}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}