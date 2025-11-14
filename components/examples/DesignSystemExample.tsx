// components/examples/DesignSystemExample.tsx
"use client";

import React from 'react';
import { 
  getButtonClasses, 
  getInputClasses, 
  getCardClasses, 
  getAlertClasses, 
  getBadgeClasses,
  getColor,
  getSpacing,
  cn
} from '@/lib/utils';

export default function DesignSystemExample() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Design System Components
        </h1>

        {/* Buttons Section */}
        <div className={getCardClasses('default', 'lg')}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buttons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className={getButtonClasses('primary', 'sm')}>
              Primary SM
            </button>
            <button className={getButtonClasses('secondary', 'md')}>
              Secondary MD
            </button>
            <button className={getButtonClasses('outline', 'lg')}>
              Outline LG
            </button>
            <button className={getButtonClasses('ghost', 'xl')}>
              Ghost XL
            </button>
            <button className={getButtonClasses('success', 'md')}>
              Success
            </button>
            <button className={getButtonClasses('warning', 'md')}>
              Warning
            </button>
            <button className={getButtonClasses('error', 'md')}>
              Error
            </button>
            <button className={getButtonClasses('info', 'md')}>
              Info
            </button>
          </div>
          
          <div className="mt-4">
            <button className={getButtonClasses('primary', 'md', true)}>
              Full Width Button
            </button>
          </div>
        </div>

        {/* Inputs Section */}
        <div className={getCardClasses('default', 'lg')}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Input
              </label>
              <input 
                type="text" 
                placeholder="Enter text..."
                className={getInputClasses('default', 'md')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Success Input
              </label>
              <input 
                type="text" 
                placeholder="Valid input"
                className={getInputClasses('success', 'md')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error Input
              </label>
              <input 
                type="text" 
                placeholder="Invalid input"
                className={getInputClasses('error', 'md')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warning Input
              </label>
              <input 
                type="text" 
                placeholder="Warning input"
                className={getInputClasses('warning', 'md')}
              />
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className={getCardClasses('default', 'lg')}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts</h2>
          <div className="space-y-4">
            <div className={getAlertClasses('info')}>
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium">Information</h3>
                <p className="text-sm">This is an informational message.</p>
              </div>
            </div>

            <div className={getAlertClasses('success')}>
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium">Success</h3>
                <p className="text-sm">Operation completed successfully!</p>
              </div>
            </div>

            <div className={getAlertClasses('warning')}>
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium">Warning</h3>
                <p className="text-sm">Please review this information carefully.</p>
              </div>
            </div>

            <div className={getAlertClasses('error')}>
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium">Error</h3>
                <p className="text-sm">Something went wrong. Please try again.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className={getCardClasses('default', 'lg')}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <span className={getBadgeClasses('primary', 'sm')}>Primary SM</span>
            <span className={getBadgeClasses('secondary', 'md')}>Secondary MD</span>
            <span className={getBadgeClasses('success', 'lg')}>Success LG</span>
            <span className={getBadgeClasses('warning', 'md')}>Warning</span>
            <span className={getBadgeClasses('error', 'md')}>Error</span>
            <span className={getBadgeClasses('info', 'md')}>Info</span>
            <span className={getBadgeClasses('outline', 'md')}>Outline</span>
            <span className={getBadgeClasses('ghost', 'md')}>Ghost</span>
          </div>
        </div>

        {/* Card Variants Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={getCardClasses('default', 'md')}>
            <h3 className="font-medium text-gray-900 mb-2">Default Card</h3>
            <p className="text-sm text-gray-600">This is a default card with shadow.</p>
          </div>
          
          <div className={getCardClasses('elevated', 'md')}>
            <h3 className="font-medium text-gray-900 mb-2">Elevated Card</h3>
            <p className="text-sm text-gray-600">This card has elevated shadow with hover effect.</p>
          </div>
          
          <div className={getCardClasses('outlined', 'md')}>
            <h3 className="font-medium text-gray-900 mb-2">Outlined Card</h3>
            <p className="text-sm text-gray-600">This card has a border instead of shadow.</p>
          </div>
          
          <div className={getCardClasses('flat', 'md')}>
            <h3 className="font-medium text-gray-900 mb-2">Flat Card</h3>
            <p className="text-sm text-gray-600">This card has no shadow or border.</p>
          </div>
        </div>

        {/* Utility Examples */}
        <div className={getCardClasses('default', 'lg')}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Utility Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Color Utilities</h3>
              <div className="flex space-x-4">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getColor('primary') }}
                >
                  Primary
                </div>
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getColor('secondary') }}
                >
                  Secondary
                </div>
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getColor('success') }}
                >
                  Success
                </div>
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getColor('gray.500') }}
                >
                  Gray
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Spacing Utilities</h3>
              <div className="flex items-center space-x-4">
                <div 
                  className="bg-blue-100 border-2 border-blue-300 rounded"
                  style={{ padding: getSpacing(2) }}
                >
                  Spacing 2
                </div>
                <div 
                  className="bg-blue-100 border-2 border-blue-300 rounded"
                  style={{ padding: getSpacing(4) }}
                >
                  Spacing 4
                </div>
                <div 
                  className="bg-blue-100 border-2 border-blue-300 rounded"
                  style={{ padding: getSpacing(8) }}
                >
                  Spacing 8
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Class Name Utility</h3>
              <div 
                className={cn(
                  'p-4 rounded-lg border-2',
                  'bg-gradient-to-r from-purple-400 to-pink-400',
                  'text-white font-medium',
                  'transform hover:scale-105 transition-transform duration-200'
                )}
              >
                Combined classes with cn() utility
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}