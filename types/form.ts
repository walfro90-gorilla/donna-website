// types/form.ts
export type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export type FieldType = 'email' | 'phone' | 'name' | 'password';

export type UserType = 'restaurant' | 'repartidor' | 'cliente';

export interface FormState {
  [key: string]: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface RestaurantFormData {
  owner_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  restaurant_name: string;
}

export interface ClientFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface DeliveryDriverFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

