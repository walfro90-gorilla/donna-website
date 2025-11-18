'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestSupabasePage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Test 1: Crear cliente
      addResult('1. Crear cliente', 'Iniciando...');
      const supabase = createClient();
      addResult('1. Crear cliente', '✅ Cliente creado');

      // Test 2: Query simple
      addResult('2. Query simple', 'Consultando tabla users...');
      const startTime = Date.now();
      const { data, error } = await supabase.from('users').select('count');
      const duration = Date.now() - startTime;
      
      if (error) {
        addResult('2. Query simple', `❌ Error: ${error.message} (${duration}ms)`);
      } else {
        addResult('2. Query simple', `✅ Éxito: ${JSON.stringify(data)} (${duration}ms)`);
      }

      // Test 3: Auth - getSession
      addResult('3. Get Session', 'Obteniendo sesión...');
      const startTime2 = Date.now();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const duration2 = Date.now() - startTime2;
      
      if (sessionError) {
        addResult('3. Get Session', `❌ Error: ${sessionError.message} (${duration2}ms)`);
      } else {
        addResult('3. Get Session', `✅ Sesión: ${sessionData.session ? 'Existe' : 'No existe'} (${duration2}ms)`);
      }

      // Test 4: Auth - signInWithPassword (con timeout)
      addResult('4. Sign In Test', 'Probando signInWithPassword...');
      const startTime3 = Date.now();
      
      const signInPromise = supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'wrongpassword'
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout después de 10s')), 10000)
      );
      
      try {
        const result = await Promise.race([signInPromise, timeoutPromise]);
        const duration3 = Date.now() - startTime3;
        addResult('4. Sign In Test', `✅ Respuesta recibida (${duration3}ms): ${JSON.stringify((result as any).error?.message || 'OK')}`);
      } catch (timeoutError: any) {
        const duration3 = Date.now() - startTime3;
        addResult('4. Sign In Test', `❌ ${timeoutError.message} (${duration3}ms)`);
      }

    } catch (error: any) {
      addResult('Error General', `❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Test de Conexión a Supabase
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Información del Proyecto</h2>
          <div className="space-y-2 text-sm font-mono">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...</p>
          </div>
        </div>

        <button
          onClick={testConnection}
          disabled={loading}
          className="w-full bg-[#e4007c] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#c0006a] disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
        >
          {loading ? 'Ejecutando Tests...' : 'Ejecutar Tests de Conexión'}
        </button>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resultados</h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                  <p className="font-semibold text-gray-700">{result.test}</p>
                  <p className="text-sm text-gray-600 font-mono">{JSON.stringify(result.result)}</p>
                  <p className="text-xs text-gray-400">{result.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Qué Buscar:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>Test 1:</strong> Debe completarse instantáneamente</li>
            <li>• <strong>Test 2:</strong> Debe completarse en menos de 2 segundos</li>
            <li>• <strong>Test 3:</strong> Debe completarse en menos de 2 segundos</li>
            <li>• <strong>Test 4:</strong> Debe responder (aunque sea con error) en menos de 5 segundos</li>
            <li>• <strong>Si algún test tarda más de 10s:</strong> El proyecto de Supabase está pausado o hay problemas de red</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-[#e4007c] hover:underline"
          >
            ← Volver al Login
          </a>
        </div>
      </div>
    </div>
  );
}
