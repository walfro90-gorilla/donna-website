// components/DebugPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const runDebug = async () => {
    const supabase = createClient();
    
    try {
      // Get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      let userData = null;
      let userError = null;
      
      if (sessionData?.session?.user) {
        // Get user data from database
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();
        
        userData = result.data;
        userError = result.error;
      }
      
      setDebugInfo({
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message || null,
        userId: sessionData?.session?.user?.id || null,
        userEmail: sessionData?.session?.user?.email || null,
        userData: userData,
        userError: userError?.message || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    // Run debug on mount
    runDebug();
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-600 rounded-lg shadow-xl p-4 max-w-md z-50 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-purple-600">🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <button
        onClick={runDebug}
        className="w-full bg-purple-600 text-white px-4 py-2 rounded mb-4 hover:bg-purple-700"
      >
        🔄 Refresh Debug Info
      </button>

      {debugInfo && (
        <div className="space-y-2 text-sm">
          <div className="border-b pb-2">
            <p className="font-semibold">Timestamp:</p>
            <p className="text-gray-600">{debugInfo.timestamp}</p>
          </div>

          <div className="border-b pb-2">
            <p className="font-semibold">Has Session:</p>
            <p className={debugInfo.hasSession ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.hasSession ? '✅ Yes' : '❌ No'}
            </p>
          </div>

          {debugInfo.sessionError && (
            <div className="border-b pb-2">
              <p className="font-semibold text-red-600">Session Error:</p>
              <p className="text-red-500">{debugInfo.sessionError}</p>
            </div>
          )}

          {debugInfo.userId && (
            <div className="border-b pb-2">
              <p className="font-semibold">User ID:</p>
              <p className="text-gray-600 break-all">{debugInfo.userId}</p>
            </div>
          )}

          {debugInfo.userEmail && (
            <div className="border-b pb-2">
              <p className="font-semibold">Email:</p>
              <p className="text-gray-600">{debugInfo.userEmail}</p>
            </div>
          )}

          {debugInfo.userData && (
            <div className="border-b pb-2">
              <p className="font-semibold">User Data:</p>
              <div className="bg-gray-50 p-2 rounded mt-1">
                <p><strong>Role:</strong> {debugInfo.userData.role || 'N/A'}</p>
                <p><strong>Name:</strong> {debugInfo.userData.full_name || 'N/A'}</p>
                <p><strong>Phone:</strong> {debugInfo.userData.phone || 'N/A'}</p>
              </div>
            </div>
          )}

          {debugInfo.userError && (
            <div className="border-b pb-2">
              <p className="font-semibold text-red-600">User Data Error:</p>
              <p className="text-red-500">{debugInfo.userError}</p>
            </div>
          )}

          {debugInfo.error && (
            <div className="border-b pb-2">
              <p className="font-semibold text-red-600">General Error:</p>
              <p className="text-red-500">{debugInfo.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>💡 Tip: Refresh after login to see updated info</p>
      </div>
    </div>
  );
}
