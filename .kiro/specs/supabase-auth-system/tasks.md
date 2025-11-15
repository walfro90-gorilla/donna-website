# Implementation Plan

- [x] 1. Create authentication types and interfaces





  - Create `types/auth.ts` file with TypeScript interfaces for authentication
  - Define `UserRole`, `AuthSession`, `LoginCredentials`, `AuthError`, and `AuthResult` types
  - Ensure types are compatible with existing `types/user.ts` definitions
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4_

- [x] 2. Implement authentication utility functions






  - [x] 2.1 Create `lib/supabase/auth.ts` with core authentication functions

    - Implement `signInWithEmail()` function for email/password authentication
    - Implement `signInWithGoogle()` function for Google OAuth flow
    - Implement `getUserRole()` function to fetch user role from database
    - Implement `getRedirectPath()` function for role-based routing
    - Implement `signOut()` function for user logout
    - Implement `getSession()` function to retrieve current session
    - Add proper error handling and TypeScript types for all functions
    - _Requirements: 1.3, 1.4, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4_

- [x] 3. Create login form component



  - [x] 3.1 Implement login form state management and validation


    - Create client component with form state (email, password, loading, errors)
    - Implement client-side form validation for email format and required fields
    - Add validation error display using existing `ErrorMessage` component
    - Implement form submission handler that prevents default and validates inputs
    - _Requirements: 1.1, 1.2, 3.1, 3.4, 4.1, 4.2_
  

  - [x] 3.2 Implement email/password authentication handler
    - Create `handleEmailLogin()` function that calls `signInWithEmail()`
    - Add loading state management during authentication
    - Implement error handling for invalid credentials and network errors
    - Add success handling that triggers role-based redirect
    - _Requirements: 1.3, 1.4, 1.5, 3.1, 3.2, 4.1, 4.2, 4.3_
  

  - [x] 3.3 Implement Google OAuth authentication handler
    - Create `handleGoogleLogin()` function that calls `signInWithGoogle()`
    - Add loading state management during OAuth flow
    - Implement error handling for cancelled OAuth and network errors
    - Add success handling that triggers role-based redirect
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 4.1, 4.2, 4.3_

  
  - [x] 3.4 Build responsive and accessible form UI

    - Create form layout with email input, password input, and submit button
    - Add Google login button with proper styling
    - Implement responsive design for mobile (320px+), tablet, and desktop
    - Add proper ARIA labels, roles, and live regions for accessibility
    - Implement keyboard navigation support (Tab order, Enter to submit)
    - Add focus management and visible focus indicators
    - Ensure minimum 44x44px touch targets for mobile
    - Add loading spinner component during authentication
    - Style components using existing design system colors and spacing
    - _Requirements: 1.1, 1.2, 2.1, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Create login page route





  - Create `app/login/page.tsx` as server component
  - Import and render the login form component
  - Add page metadata (title, description)
  - Implement responsive container layout matching existing pages
  - Add proper semantic HTML structure with main landmark
  - _Requirements: 1.1, 1.2, 2.1, 6.1, 6.2, 6.3_

- [x] 5. Implement role-based redirect logic





  - Add redirect logic after successful authentication in form component
  - Implement `getRedirectPath()` to return correct path based on role
  - Handle restaurant role redirect to `/restaurant` or `/socios`
  - Handle admin role redirect to `/admin`
  - Handle client role redirect to `/` or `/clientes`
  - Handle missing role scenario with error message and default redirect
  - Use Next.js router for client-side navigation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Add error handling and user feedback








  - Implement error message display for authentication failures
  - Add network error handling with user-friendly messages
  - Implement validation error display for form fields
  - Add ARIA live regions for error announcements to screen readers
  - Create error message constants for consistent messaging
  - Ensure errors are displayed in Spanish matching existing UI
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Update header component with login link





  - Modify `components/Header.tsx` to link "Entrar" button to `/login`
  - Update both desktop and mobile menu login buttons
  - Ensure proper navigation and accessibility attributes
  - _Requirements: 1.1, 2.1_

- [x] 8. Create authentication integration tests






  - Write integration tests for complete email/password login flow
  - Write integration tests for Google OAuth flow initiation
  - Write tests for role-based redirect logic
  - Write tests for error handling scenarios
  - _Requirements: 1.3, 1.4, 2.2, 2.3, 3.1, 5.1, 5.2, 5.3_

- [x] 9. Perform accessibility testing






  - Test keyboard navigation through login form
  - Test screen reader compatibility with NVDA or JAWS
  - Verify ARIA labels and live regions
  - Test focus management during loading and errors
  - Verify minimum touch target sizes on mobile
  - _Requirements: 6.4, 6.5_
