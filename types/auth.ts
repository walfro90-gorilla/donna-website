// types/auth.ts

// User roles for authentication and authorization
// Note: These map to the existing UserRole in user.ts
// 'restaurant' maps to 'restaurante', 'client' maps to 'cliente', 'admin' is a new role
export type UserRole = 'restaurant' | 'admin' | 'client' | 'delivery';

// Basic authenticated user info (without role to avoid type conflicts)
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

// Authentication session containing user info and role
export interface AuthSession {
  user: AuthUser;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

// Login credentials for email/password authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

// Authentication error structure
export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

// Result of authentication operations
export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  role?: UserRole;
  error?: string;
}
