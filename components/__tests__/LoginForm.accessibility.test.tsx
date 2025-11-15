// components/__tests__/LoginForm.accessibility.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import * as authModule from '@/lib/supabase/auth';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock auth module
vi.mock('@/lib/supabase/auth', () => ({
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  getRedirectPath: vi.fn(),
  getSession: vi.fn(),
  getUserRole: vi.fn(),
}));

describe('LoginForm - Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.getSession).mockResolvedValue(null);
  });

  describe('Keyboard Navigation', () => {
    it('should allow tab navigation through all interactive elements in correct order', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Start from document body
      document.body.focus();

      // Tab to email input
      await user.tab();
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveFocus();

      // Tab to password input
      await user.tab();
      const passwordInput = screen.getByLabelText(/contraseña/i);
      expect(passwordInput).toHaveFocus();

      // Tab to submit button
      await user.tab();
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      expect(submitButton).toHaveFocus();

      // Tab to Google login button
      await user.tab();
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      expect(googleButton).toHaveFocus();
    });

    it('should submit form when Enter key is pressed in email field', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockResolvedValue({
        success: true,
        role: 'client',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(authModule.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should submit form when Enter key is pressed in password field', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockResolvedValue({
        success: true,
        role: 'client',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Focus on password field and press Enter
      passwordInput.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(authModule.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should disable tab navigation to buttons during loading state', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, role: 'client' }), 1000))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // During loading, buttons should be disabled
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /iniciando sesión/i });
        const googleButton = screen.getByRole('button', { name: /continuar con google/i });
        
        expect(submitButton).toBeDisabled();
        expect(googleButton).toBeDisabled();
      });
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA labels on email input', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id', 'email');
    });

    it('should have proper ARIA labels on password input', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/contraseña/i);
      
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('should update aria-invalid when validation fails', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);
        
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should associate error messages with inputs using aria-describedby', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);
        
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
        expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');
        
        // Verify error elements exist with correct IDs
        expect(screen.getByText(/el email es requerido/i).closest('[id="email-error"]')).toBeInTheDocument();
        expect(screen.getByText(/la contraseña es requerida/i).closest('[id="password-error"]')).toBeInTheDocument();
      });
    });

    it('should have proper button roles and labels', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });

      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(googleButton).toHaveAttribute('type', 'button');
    });

    it('should update aria-busy during loading state', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, role: 'client' }), 1000))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /iniciando sesión/i });
        expect(loadingButton).toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  describe('ARIA Live Regions', () => {
    it('should announce authentication errors to screen readers', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockResolvedValue({
        success: false,
        error: 'Email o contraseña incorrectos',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
        expect(errorAlert).toHaveAttribute('aria-atomic', 'true');
        expect(errorAlert).toHaveTextContent(/email o contraseña incorrectos/i);
      });
    });

    it('should announce network errors to screen readers', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockRejectedValue(new Error('fetch failed'));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
        expect(errorAlert).toHaveTextContent(/error de conexión/i);
      });
    });

    it('should clear error announcements when user corrects input', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Trigger validation errors
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      });

      // Start typing in email field
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 't');

      // Email error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/el email es requerido/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus on email input after validation error', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      emailInput.focus();

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Focus should remain manageable (not lost)
      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      });

      // User should be able to continue typing
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should show visible focus indicators on all interactive elements', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });

      // Check that focus ring classes are present
      expect(emailInput.className).toContain('focus:ring');
      expect(passwordInput.className).toContain('focus:ring');
      expect(submitButton.className).toContain('focus:ring');
      expect(googleButton.className).toContain('focus:ring');
    });

    it('should not trap focus during normal operation', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      emailInput.focus();

      // Should be able to tab through all elements and back to body
      await user.tab(); // password
      await user.tab(); // submit button
      await user.tab(); // google button
      await user.tab(); // should move to next focusable element (or wrap)

      // Focus should have moved away from the form
      expect(screen.getByRole('button', { name: /continuar con google/i })).not.toHaveFocus();
    });

    it('should disable inputs during loading state', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, role: 'client' }), 1000))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });
  });

  describe('Touch Target Sizes', () => {
    it('should have minimum 44x44px touch targets for email input', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      
      // Check for min-h-[44px] class
      expect(emailInput.className).toContain('min-h-[44px]');
    });

    it('should have minimum 44x44px touch targets for password input', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/contraseña/i);
      
      // Check for min-h-[44px] class
      expect(passwordInput.className).toContain('min-h-[44px]');
    });

    it('should have minimum 44x44px touch targets for submit button', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      // Check for min-h-[44px] class
      expect(submitButton.className).toContain('min-h-[44px]');
    });

    it('should have minimum 44x44px touch targets for Google button', () => {
      render(<LoginForm />);

      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      
      // Check for min-h-[44px] class
      expect(googleButton.className).toContain('min-h-[44px]');
    });

    it('should have adequate padding for touch targets', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });

      // Check for py-3 (12px vertical padding) which ensures good touch target
      expect(submitButton.className).toContain('py-3');
      expect(googleButton.className).toContain('py-3');
    });
  });

  describe('Form Semantics', () => {
    it('should use semantic HTML form element', () => {
      render(<LoginForm />);

      const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
      expect(form).toBeInTheDocument();
      expect(form?.tagName).toBe('FORM');
    });

    it('should have proper autocomplete attributes', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should mark required fields with aria-required', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have noValidate attribute to use custom validation', () => {
      render(<LoginForm />);

      const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
      expect(form).toHaveAttribute('noValidate');
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should hide decorative icons from screen readers', () => {
      render(<LoginForm />);

      // Google icon should be hidden
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      const googleIcon = googleButton.querySelector('svg');
      expect(googleIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should hide decorative asterisks from screen readers', () => {
      const { container } = render(<LoginForm />);

      // Required asterisks should be aria-hidden
      const asterisks = container.querySelectorAll('[aria-hidden="true"]');
      const requiredAsterisks = Array.from(asterisks).filter(el => el.textContent === '*');
      
      expect(requiredAsterisks.length).toBeGreaterThan(0);
    });

    it('should provide descriptive button text for screen readers', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });

      expect(submitButton).toHaveTextContent('Iniciar Sesión');
      expect(googleButton).toHaveTextContent('Continuar con Google');
    });

    it('should announce loading state changes to screen readers', async () => {
      const user = userEvent.setup();
      vi.mocked(authModule.signInWithEmail).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, role: 'client' }), 500))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Button text should change to indicate loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iniciando sesión/i })).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility on mobile viewport', () => {
      // Simulate mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(<LoginForm />);

      // All accessibility features should still work
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
      expect(emailInput.className).toContain('min-h-[44px]');
      expect(passwordInput.className).toContain('min-h-[44px]');
    });

    it('should have responsive container with proper padding', () => {
      const { container } = render(<LoginForm />);

      const formContainer = container.querySelector('.w-full.max-w-md');
      expect(formContainer).toBeInTheDocument();
      expect(formContainer?.className).toContain('px-4'); // Mobile padding
    });
  });
});
