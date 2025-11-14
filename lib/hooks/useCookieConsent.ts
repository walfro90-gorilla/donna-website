// lib/hooks/useCookieConsent.ts
"use client";

import { useState, useEffect } from 'react';

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load consent from localStorage
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem('cookie-consent');
        if (stored) {
          const parsed = JSON.parse(stored);
          setConsent(parsed);
        }
      } catch (error) {
        console.error('Error loading cookie consent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  const updateConsent = (newConsent: Partial<CookieConsent>) => {
    const updatedConsent = {
      necessary: true, // Always true
      analytics: newConsent.analytics ?? false,
      marketing: newConsent.marketing ?? false,
      functional: newConsent.functional ?? false,
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...newConsent
    };

    localStorage.setItem('cookie-consent', JSON.stringify(updatedConsent));
    setConsent(updatedConsent);
  };

  const revokeConsent = () => {
    localStorage.removeItem('cookie-consent');
    setConsent(null);
  };

  const hasConsent = (type: keyof Omit<CookieConsent, 'timestamp' | 'version'>) => {
    return consent?.[type] ?? false;
  };

  const isConsentGiven = () => {
    return consent !== null;
  };

  return {
    consent,
    isLoading,
    updateConsent,
    revokeConsent,
    hasConsent,
    isConsentGiven
  };
}

// Utility functions for cookie management
export const cookieUtils = {
  // Set a cookie with consent check
  setCookie: (name: string, value: string, days: number = 30, type: 'necessary' | 'analytics' | 'marketing' | 'functional' = 'necessary') => {
    if (typeof window === 'undefined') return;

    // Check if this type of cookie is allowed
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      const parsed = JSON.parse(consent);
      if (!parsed[type] && type !== 'necessary') {
        console.warn(`Cookie ${name} not set: ${type} cookies not consented`);
        return;
      }
    } else if (type !== 'necessary') {
      console.warn(`Cookie ${name} not set: No consent given`);
      return;
    }

    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  },

  // Get a cookie value
  getCookie: (name: string): string | null => {
    if (typeof window === 'undefined') return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  // Delete a cookie
  deleteCookie: (name: string) => {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },

  // Clear all non-necessary cookies when consent is revoked
  clearNonNecessaryCookies: () => {
    if (typeof window === 'undefined') return;

    const cookies = document.cookie.split(';');
    const necessaryCookies = ['session', 'csrf', 'auth', 'cookie-consent'];

    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (!necessaryCookies.some(necessary => name.includes(necessary))) {
        cookieUtils.deleteCookie(name);
      }
    });
  }
};

// Analytics integration
export const analytics = {
  // Initialize Google Analytics if consent is given
  initializeGA: (measurementId: string) => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      const parsed = JSON.parse(consent);
      if (parsed.analytics && typeof window !== 'undefined') {
        // Load Google Analytics
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        gtag('js', new Date());
        gtag('config', measurementId, {
          anonymize_ip: true,
          cookie_flags: 'SameSite=Lax;Secure'
        });
      }
    }
  },

  // Track event if analytics consent is given
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      const parsed = JSON.parse(consent);
      if (parsed.analytics && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, parameters);
      }
    }
  }
};

// Marketing integration
export const marketing = {
  // Initialize Facebook Pixel if consent is given
  initializeFacebookPixel: (pixelId: string) => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      const parsed = JSON.parse(consent);
      if (parsed.marketing && typeof window !== 'undefined') {
        // Load Facebook Pixel
        !function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
      }
    }
  },

  // Track conversion if marketing consent is given
  trackConversion: (eventName: string, parameters?: Record<string, any>) => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      const parsed = JSON.parse(consent);
      if (parsed.marketing && typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, parameters);
      }
    }
  }
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}