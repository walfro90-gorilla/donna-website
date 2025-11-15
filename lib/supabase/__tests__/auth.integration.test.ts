import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  signInWithEmail,
  signInWithGoogle,
  getRedirectPath,
  getUserRole,
  signOut,
  getSession,
} from '../auth';
import { createClient } from '../client';

// Mock the Supabase client
vi.mock('../client', () => ({
  createClient: vi.fn(),
}));

describe('Authentication Integration Tests', () => {
  let mockSupabaseClient: any;
  let mockSingle: any;

  beforeEach(() => {
    // Create mock for the chained query methods
    mockSingle = vi.fn();
    
    // Create a fresh mock for each test
    mockSupabaseClient = {
      auth: {
        signInWithPassword: vi.fn(),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle,
          })),
        })),
      })),
    };

    (createClient as any).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Email/Password Login Flow', () => {
    it('should successfully authenticate with valid credentials and return user with role', async () => {
      // Mock successful authentication
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock successful role fetch
      mockSingle.mockResolvedValue({
        data: { role: 'client' },
        error: null,
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
      expect(result.role).toBe('client');
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error for invalid credentials', async () => {
      // Mock authentication failure
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Invalid login credentials',
          status: 400,
        },
      });

      const result = await signInWithEmail('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email o contraseña incorrectos');
      expect(result.user).toBeUndefined();
      expect(result.role).toBeUndefined();
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new TypeError('fetch failed')
      );

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error de conexión. Por favor, verifica tu internet');
    });

    it('should handle missing user role', async () => {
      // Mock successful authentication
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock role fetch failure
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo obtener el rol del usuario');
    });

    it('should handle email not confirmed error', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Email not confirmed',
          status: 400,
        },
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Por favor confirma tu email antes de iniciar sesión');
    });

    it('should handle too many requests error', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Too many requests',
          status: 429,
        },
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Demasiados intentos. Por favor intenta más tarde');
    });
  });

  describe('Google OAuth Login Flow', () => {
    it('should successfully initiate Google OAuth flow', async () => {
      // Mock successful OAuth initiation
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth...' },
        error: null,
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/login',
        },
      });
    });

    it('should handle OAuth cancellation', async () => {
      // Mock OAuth cancellation
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: {
          message: 'User cancelled OAuth flow',
        },
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Inicio de sesión con Google cancelado');
    });

    it('should handle popup blocked error', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: {
          message: 'popup blocked by browser',
        },
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Por favor permite las ventanas emergentes para continuar');
    });

    it('should handle network errors during OAuth', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockRejectedValue(
        new TypeError('fetch failed')
      );

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error de conexión. Por favor, verifica tu internet');
    });
  });

  describe('Role-Based Redirect Logic', () => {
    it('should redirect restaurant users to /socios', () => {
      const path = getRedirectPath('restaurant');
      expect(path).toBe('/socios');
    });

    it('should redirect admin users to /admin', () => {
      const path = getRedirectPath('admin');
      expect(path).toBe('/admin');
    });

    it('should redirect client users to /clientes', () => {
      const path = getRedirectPath('client');
      expect(path).toBe('/clientes');
    });

    it('should redirect delivery users to /repartidores', () => {
      const path = getRedirectPath('delivery');
      expect(path).toBe('/repartidores');
    });

    it('should redirect to home for unknown roles', () => {
      const path = getRedirectPath('unknown' as any);
      expect(path).toBe('/');
    });
  });

  describe('User Role Retrieval', () => {
    it('should successfully fetch user role from database', async () => {
      mockSingle.mockResolvedValue({
        data: { role: 'restaurant' },
        error: null,
      });

      const role = await getUserRole('user-123');

      expect(role).toBe('restaurant');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('should return null when user role not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      const role = await getUserRole('user-123');

      expect(role).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSingle.mockRejectedValue(new Error('Database connection failed'));

      const role = await getUserRole('user-123');

      expect(role).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should successfully retrieve current session', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        access_token: 'token-123',
        refresh_token: 'refresh-123',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await getSession();

      expect(session).toEqual(mockSession);
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });

    it('should return null when no session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it('should handle session retrieval errors', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it('should successfully sign out user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      await expect(signOut()).resolves.toBeUndefined();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error when sign out fails', async () => {
      mockSupabaseClient.auth.signOut.mockRejectedValue(
        new Error('Sign out failed')
      );

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('Complete Authentication Flow Integration', () => {
    it('should complete full login flow with role-based redirect', async () => {
      // Step 1: Authenticate user
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'restaurant@example.com',
          },
        },
        error: null,
      });

      // Step 2: Fetch user role
      mockSingle.mockResolvedValue({
        data: { role: 'restaurant' },
        error: null,
      });

      // Execute login
      const result = await signInWithEmail('restaurant@example.com', 'password123');

      // Verify authentication result
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('user-123');
      expect(result.role).toBe('restaurant');

      // Step 3: Get redirect path
      const redirectPath = getRedirectPath(result.role!);
      expect(redirectPath).toBe('/socios');
    });

    it('should handle delivery_agent role mapping correctly', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-456',
            email: 'delivery@example.com',
          },
        },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: { role: 'delivery_agent' },
        error: null,
      });

      const result = await signInWithEmail('delivery@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.role).toBe('delivery');

      const redirectPath = getRedirectPath(result.role!);
      expect(redirectPath).toBe('/repartidores');
    });
  });
});
