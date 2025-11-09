// types/user.ts
export type UserRole = 'cliente' | 'restaurante' | 'repartidor';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserMetadata {
  name?: string;
  phone?: string;
  role: UserRole;
}

export interface RestaurantProfile {
  user_id: string;
  restaurant_name: string;
  email: string;
  phone: string;
  address: string;
  address_structured: { [key: string]: string };
  location_lat: number | null;
  location_lon: number | null;
  location_place_id: string | null;
}

export interface ClientProfile {
  user_id: string;
  email: string;
  name: string;
  phone: string;
  address?: string;
  address_structured?: { [key: string]: string };
  location_lat?: number | null;
  location_lon?: number | null;
  location_place_id?: string | null;
}

export interface DeliveryDriverProfile {
  user_id: string;
  email: string;
  name: string;
  phone: string;
}

