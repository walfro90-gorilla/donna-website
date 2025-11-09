import { useSupabase } from '@/lib/hooks/useSupabase';
import { useState, useEffect } from 'react';

export type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';
export type FieldType = 'email' | 'phone' | 'name';
export type UserType = 'restaurant' | 'repartidor' | 'cliente';

// Re-exportar tipos para compatibilidad
export type { ValidationStatus, FieldType } from '@/types/form';

export function useFieldValidation(
  field: FieldType,
  value: string,
  userType: UserType
) {
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const supabase = useSupabase();

  useEffect(() => {
    // Si el campo está vacío, resetear estado
    if (!value) {
      setStatus('idle');
      return;
    }

    // Validaciones de formato según el tipo de campo
    if (field === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
      setStatus('idle');
      return;
    }

    if (field === 'phone' && !/^[0-9()+\-\s]{7,20}$/.test(value)) {
      setStatus('idle');
      return;
    }

    // Si es un nombre de restaurante, solo validar si tiene al menos 3 caracteres
    if (field === 'name' && userType === 'restaurant' && value.length < 3) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    let cancelled = false;
    const debounceTimer = setTimeout(async () => {
      try {
        const rpcName = `validate_${field}`;
        const params = {
          [`p_${field}`]: value,
          p_user_type: userType
        };

        const { data: isTaken, error } = await supabase.rpc(rpcName, params);

        if (cancelled) return;

        if (error) {
          console.error(`Error validating ${field}:`, error);
          setStatus('invalid');
          return;
        }

        setStatus(isTaken ? 'invalid' : 'valid');

      } catch (e) {
        if (!cancelled) {
          console.error(`Error in ${field} validation:`, e);
          setStatus('invalid');
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [value, field, userType, supabase]);

  return status;
}