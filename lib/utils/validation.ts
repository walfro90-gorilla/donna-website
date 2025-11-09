// lib/utils/validation.ts
import { MIN_LENGTHS, MAX_LENGTHS } from '@/lib/constants';

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de teléfono (permite números, espacios, guiones, paréntesis, +)
 */
export function isValidPhone(phone: string): boolean {
  // Remover espacios y caracteres especiales para validar
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Debe tener entre 7 y 20 dígitos
  return /^\+?[0-9]{7,20}$/.test(cleaned);
}

/**
 * Valida fuerza de contraseña
 * Retorna: 'weak' | 'medium' | 'strong'
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < MIN_LENGTHS.password) {
    return 'weak';
  }

  let strength = 0;

  // Longitud
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Contiene mayúsculas
  if (/[A-Z]/.test(password)) strength++;

  // Contiene minúsculas
  if (/[a-z]/.test(password)) strength++;

  // Contiene números
  if (/[0-9]/.test(password)) strength++;

  // Contiene caracteres especiales
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
}

/**
 * Valida si una contraseña cumple con los requisitos mínimos
 */
export function isValidPassword(password: string): boolean {
  return (
    password.length >= MIN_LENGTHS.password &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Valida nombre (mínimo 2 caracteres, solo letras, espacios, guiones, apostrofes)
 */
export function isValidName(name: string): boolean {
  if (name.length < MIN_LENGTHS.name) return false;
  // Permitir letras, espacios, guiones, apostrofes y acentos
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name);
}

/**
 * Valida nombre de restaurante (similar a name pero permite números y algunos caracteres especiales)
 */
export function isValidRestaurantName(name: string): boolean {
  if (name.length < MIN_LENGTHS.restaurantName) return false;
  // Permitir letras, números, espacios, guiones, apostrofes, comas, puntos, y acentos
  return /^[a-zA-ZÀ-ÿ0-9\s'-.,&]+$/.test(name);
}

/**
 * Valida que un campo no esté vacío después de trim
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Valida longitud de un string
 */
export function isValidLength(value: string, min?: number, max?: number): boolean {
  if (min !== undefined && value.length < min) return false;
  if (max !== undefined && value.length < max) return false;
  return true;
}

/**
 * Normaliza el teléfono a formato canónico con código de país (+52 para México)
 * Si ya tiene código de país, lo mantiene. Si no, asume +52 (México)
 */
export function normalizePhoneToCanonical(phone: string): string {
  // Remover todos los espacios, guiones, paréntesis
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Si ya tiene código de país (empieza con +), retornarlo
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Si empieza con 52 (código de México sin +), agregar +
  if (cleaned.startsWith('52') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }
  
  // Si no tiene código, asumir México (+52) y agregar el código
  // Si tiene 10 dígitos, es un número mexicano sin código
  if (/^[0-9]{10}$/.test(cleaned)) {
    return `+52${cleaned}`;
  }
  
  // Si tiene más de 10 dígitos pero no empieza con 52, asumir +52
  if (/^[0-9]{11,}$/.test(cleaned)) {
    return `+52${cleaned}`;
  }
  
  // Si tiene entre 7 y 10 dígitos, asumir México
  if (/^[0-9]{7,10}$/.test(cleaned)) {
    return `+52${cleaned}`;
  }
  
  // Retornar tal cual si no se puede normalizar
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}
