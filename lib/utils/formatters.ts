// lib/utils/formatters.ts

/**
 * Formatea un número de teléfono para visualización
 * Ejemplo: +52 123 456 7890 -> (+52) 123-456-7890
 */
export function formatPhone(phone: string): string {
  // Remover todos los caracteres no numéricos excepto +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si empieza con + (código de país)
  if (cleaned.startsWith('+')) {
    const codeMatch = cleaned.match(/^\+(\d{1,3})(\d+)/);
    if (codeMatch) {
      const code = codeMatch[1];
      const number = codeMatch[2];
      // Formatear número mexicano (10 dígitos después del código)
      if (code === '52' && number.length === 10) {
        return `(+${code}) ${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
      }
      // Otros formatos internacionales
      return `(+${code}) ${number}`;
    }
  }

  // Formato mexicano local (10 dígitos)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Si no cumple con ningún formato conocido, devolver el original
  return phone;
}

/**
 * Limpia un número de teléfono (solo números y +)
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Formatea un nombre capitalizando correctamente
 */
export function formatName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formatea un email a minúsculas (manteniendo el dominio)
 */
export function formatEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Trunca un texto con ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

