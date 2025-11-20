'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function CreateTestUserPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: 'restaurant@test.com',
    password: 'test123456',
    name: 'Restaurante Test',
    role: 'restaurant'
  });

  const createUser = async () => {
    setLoading(true);
    setMessage('Creando usuario...');

    try {
      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setMessage(`❌ Error creando auth: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setMessage('❌ No se pudo crear el usuario');
        setLoading(false);
        return;
      }

      setMessage('✅ Usuario auth creado, creando perfil...');

      // 2. Crear perfil en tabla users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          phone: null,
          email_confirm: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        setMessage(`❌ Error creando perfil: ${profileError.message}`);
        setLoading(false);
        return;
      }

      setMessage(`✅ Usuario creado exitosamente!
      
Email: ${formData.email}
Password: ${formData.password}
Rol: ${formData.role}

Ahora puedes hacer login con estas credenciales.`);

    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ Error inesperado: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Crear Usuario de Prueba
          </h1>
          <p className="text-gray-600 mb-6">
            Crea un usuario de prueba para testing
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]"
              >
                <option value="restaurant">Restaurant</option>
                <option value="client">Client</option>
                <option value="delivery_agent">Delivery Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            onClick={createUser}
            disabled={loading}
            className="w-full mt-6 bg-[#e4007c] text-white py-2 px-4 rounded-md hover:bg-[#c0006a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-md whitespace-pre-line ${message.includes('✅')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : message.includes('❌')
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
            {message}
          </div>
        )}

        <div className="text-center">
          <a
            href="/login"
            className="text-[#e4007c] hover:underline text-sm"
          >
            ← Volver al Login
          </a>
        </div>
      </div>
    </div>
  );
}