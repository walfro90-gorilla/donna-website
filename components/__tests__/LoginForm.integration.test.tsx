import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import * as authModule from '@/lib/supabase/auth';

// Mock the auth module
vi.mock('@/lib/supabase/auth', () => ({
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  getRedirectPath: vi.fn(),
  getSession: vi.fn(),
  getUserRole: vi.fn(),
}));

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('LoginForm Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing session
    (authModule.getSession as any).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering and Validation', () => {
    it('should render login form with all required fields', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continuar con google/i })).toBeInTheDocument();
    });

    it('should display validation errors for empty fields', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
      });
    });

    it('should display validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/por favor ingresa un email válido/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user types', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/el email es requerido/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Email/Password Authentication Flow', () => {
    it('should successfully login with valid credentials and redirect to client page', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
        role: 'client',
      });
      (authModule.getRedirectPath as any).mockReturnValue('/clientes');

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authModule.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(authModule.getRedirectPath).toHaveBeenCalledWith('client');
        expect(mockPush).toHaveBeenCalledWith('/clientes');
      });
    });

    it('should display error message for invalid credentials', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: false,
        error: 'Email o contraseña incorrectos',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during authentication', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolveAuth: any;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });
      (authModule.signInWithEmail as any).mockReturnValue(authPromise);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve the auth promise
      resolveAuth({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
        role: 'client',
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: false,
        error: 'Error de conexión. Por favor, verifica tu internet',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
      });
    });

    it('should handle missing user role scenario', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
        role: undefined,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/tu cuenta no tiene un rol asignado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Google OAuth Authentication Flow', () => {
    it('should initiate Google OAuth flow when button clicked', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithGoogle as any).mockResolvedValue({
        success: true,
      });

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(authModule.signInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should display error when Google OAuth is cancelled', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithGoogle as any).mockResolvedValue({
        success: false,
        error: 'Inicio de sesión con Google cancelado',
      });

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText(/inicio de sesión con google cancelado/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during Google OAuth', async () => {
      const user = userEvent.setup();
      
      let resolveAuth: any;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });
      (authModule.signInWithGoogle as any).mockReturnValue(authPromise);

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(googleButton).toBeDisabled();
      });

      resolveAuth({ success: true });
    });
  });

  describe('Role-Based Redirect Logic', () => {
    it('should redirect restaurant users to /socios', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'restaurant@example.com' },
        role: 'restaurant',
      });
      (authModule.getRedirectPath as any).mockReturnValue('/socios');

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'restaurant@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/socios');
      });
    });

    it('should redirect admin users to /admin', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'admin@example.com' },
        role: 'admin',
      });
      (authModule.getRedirectPath as any).mockReturnValue('/admin');

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin');
      });
    });

    it('should redirect delivery users to /repartidores', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'delivery@example.com' },
        role: 'delivery',
      });
      (authModule.getRedirectPath as any).mockReturnValue('/repartidores');

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'delivery@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/repartidores');
      });
    });
  });

  describe('Session Check on Mount', () => {
    it('should redirect authenticated users based on their role', async () => {
      (authModule.getSession as any).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      (authModule.getUserRole as any).mockResolvedValue('client');
      (authModule.getRedirectPath as any).mockReturnValue('/clientes');

      render(<LoginForm />);

      await waitFor(() => {
        expect(authModule.getSession).toHaveBeenCalled();
        expect(authModule.getUserRole).toHaveBeenCalledWith('user-123');
        expect(mockPush).toHaveBeenCalledWith('/clientes');
      });
    });

    it('should show error and redirect when user has no role', async () => {
      (authModule.getSession as any).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      (authModule.getUserRole as any).mockResolvedValue(null);

      render(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByText(/tu cuenta no tiene un rol asignado/i)).toBeInTheDocument();
      });
    });

    it('should not redirect when no session exists', async () => {
      (authModule.getSession as any).mockResolvedValue(null);

      render(<LoginForm />);

      await waitFor(() => {
        expect(authModule.getSession).toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on form fields', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      
      (authModule.signInWithEmail as any).mockResolvedValue({
        success: false,
        error: 'Email o contraseña incorrectos',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
        expect(errorAlert).toHaveTextContent(/email o contraseña incorrectos/i);
      });
    });

    it('should set aria-busy during loading', async () => {
      const user = userEvent.setup();
      
      let resolveAuth: any;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });
      (authModule.signInWithEmail as any).mockReturnValue(authPromise);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
      });

      resolveAuth({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
        role: 'client',
      });
    });
  });
});
