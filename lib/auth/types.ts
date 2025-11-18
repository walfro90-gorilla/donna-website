// lib/auth/types.ts
export type UserRole = 'admin' | 'restaurant' | 'client' | 'delivery_agent';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  phone?: string;
  email_confirm: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}