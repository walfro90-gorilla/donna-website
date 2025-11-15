// components/demo/LoadingAndFeedbackDemo.tsx
"use client";

import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Message from '@/components/Message';
import FieldMessage from '@/components/FieldMessage';
import ErrorMessage from '@/components/ErrorMessage';
import SuccessMessage from '@/components/SuccessMessage';
import FormButton from '@/components/FormButton';

export default function LoadingAndFeedbackDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowMessages(true);
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Loading States & Feedback Visual Demo
        </h1>

        {/* Loading Spinners Section */}
        <section className="mb-12 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Loading Spinners
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Spinner Sizes
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-600">Small</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="md" />
                  <span className="text-sm text-gray-600">Medium</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="lg" />
                  <span className="text-sm text-gray-600">Large</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                CSS Spinner Classes
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="spinner spinner-sm" />
                  <span className="text-sm text-gray-600">Small</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="spinner" />
                  <span className="text-sm text-gray-600">Medium</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="spinner spinner-lg" />
                  <span className="text-sm text-gray-600">Large</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Button Loading States */}
        <section className="mb-12 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Button Loading States
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <FormButton
                variant="primary"
                isLoading={isLoading}
                onClick={handleLoadingDemo}
              >
                {isLoading ? 'Cargando...' : 'Iniciar Carga'}
              </FormButton>
              <FormButton
                variant="secondary"
                isLoading={isLoading}
              >
                Botón Secundario
              </FormButton>
              <FormButton
                variant="danger"
                isLoading={isLoading}
              >
                Botón Peligro
              </FormButton>
            </div>
            <p className="text-sm text-gray-600">
              Haz clic en "Iniciar Carga" para ver el estado de carga en acción
            </p>
          </div>
        </section>

        {/* Skeleton Loaders */}
        <section className="mb-12 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Skeleton Loaders
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Text Skeletons
              </h3>
              <div className="space-y-2">
                <div className="skeleton skeleton-text" style={{ width: '100%' }} />
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Title Skeleton
              </h3>
              <div className="skeleton skeleton-title" style={{ width: '50%' }} />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Avatar Skeletons
              </h3>
              <div className="flex gap-4">
                <div className="skeleton skeleton-avatar" />
                <div className="skeleton skeleton-avatar-lg" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Button Skeleton
              </h3>
              <div className="skeleton skeleton-button" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Card Skeleton
              </h3>
              <div className="skeleton skeleton-card" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Image Skeletons
              </h3>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="skeleton skeleton-image" />
                <div className="skeleton skeleton-image-square" />
              </div>
            </div>
          </div>
        </section>

        {/* Message Components */}
        <section className="mb-12 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Message Components
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Full Messages (with background)
              </h3>
              <div className="space-y-3">
                <Message
                  type="error"
                  title="Error"
                  message="Hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo."
                />
                <Message
                  type="success"
                  title="Éxito"
                  message="Tu información ha sido guardada correctamente."
                />
                <Message
                  type="warning"
                  title="Advertencia"
                  message="Tu sesión está por expirar. Por favor, guarda tu trabajo."
                />
                <Message
                  type="info"
                  title="Información"
                  message="Hay una nueva actualización disponible para la plataforma."
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Messages with Close Button
              </h3>
              <Message
                type="success"
                title="Operación completada"
                message="Puedes cerrar este mensaje haciendo clic en la X."
                onClose={() => alert('Mensaje cerrado')}
              />
            </div>
          </div>
        </section>

        {/* Field Messages */}
        <section className="mb-12 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Field Messages (Inline)
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="error"
                placeholder="correo@ejemplo.com"
              />
              <ErrorMessage message="Por favor, ingresa un correo electrónico válido." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                className="success"
                placeholder="••••••••"
              />
              <SuccessMessage message="La contraseña cumple con todos los requisitos." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                className="warning"
                placeholder="+34 600 000 000"
              />
              <FieldMessage
                type="warning"
                message="Asegúrate de incluir el código de país."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                placeholder="usuario123"
              />
              <FieldMessage
                type="info"
                message="El nombre de usuario debe tener entre 3 y 20 caracteres."
              />
            </div>
          </div>
        </section>

        {/* Demo Result Messages */}
        {showMessages && (
          <section className="mb-12">
            <Message
              type="success"
              title="¡Carga completada!"
              message="La demostración de carga se ha completado exitosamente."
              onClose={() => setShowMessages(false)}
            />
          </section>
        )}

        {/* CSS Classes Reference */}
        <section className="mb-12 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            CSS Classes Reference
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Loading States
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-2 py-1 rounded">.spinner</code> - Base spinner</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.spinner-sm</code> - Small spinner</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.spinner-lg</code> - Large spinner</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.spinner-white</code> - White spinner</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.button-loading</code> - Button loading state</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Skeleton Loaders
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-2 py-1 rounded">.skeleton</code> - Base skeleton</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.skeleton-text</code> - Text line</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.skeleton-title</code> - Title</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.skeleton-avatar</code> - Avatar</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.skeleton-button</code> - Button</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.skeleton-card</code> - Card</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.skeleton-image</code> - Image (16:9)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Messages
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-2 py-1 rounded">.message</code> - Base message</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.message-error</code> - Error message</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.message-success</code> - Success message</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.message-warning</code> - Warning message</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.message-info</code> - Info message</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Field Messages
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-2 py-1 rounded">.field-message</code> - Base field message</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.field-message-error</code> - Error</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.field-message-success</code> - Success</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.field-message-warning</code> - Warning</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">.field-message-info</code> - Info</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
