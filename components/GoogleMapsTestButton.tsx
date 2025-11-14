// components/GoogleMapsTestButton.tsx
'use client';

import { testInBrowser } from '@/lib/utils/testGoogleMapsAPI';

export default function GoogleMapsTestButton() {
  return (
    <button
      onClick={testInBrowser}
      className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-50"
    >
      🧪 Probar Google Maps API
    </button>
  );
}