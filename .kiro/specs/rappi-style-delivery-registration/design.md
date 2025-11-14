# Design Document

## Overview

This design document outlines the creation of a modern, Rappi-inspired delivery agent registration form that combines an attractive hero section with earnings potential messaging and a streamlined registration process. The design focuses on conversion optimization, mobile responsiveness, and user experience best practices.

## Architecture

### Component Structure

```
RappiStyleDeliveryRegistration/
├── HeroSection/
│   ├── EarningsDisplay
│   ├── BackgroundImage
│   └── CallToAction
├── RegistrationForm/
│   ├── PersonalInfoFields
│   ├── ContactFields
│   ├── LocationSelector
│   └── PasswordField
├── ValidationSystem/
│   ├── RealTimeValidation
│   ├── ErrorDisplay
│   └── FormStateManager
└── LegalCompliance/
    ├── TermsCheckbox
    ├── PrivacyCheckbox
    └── ConsentManager
```

### Layout Architecture

The page will follow a single-column layout optimized for conversion:

1. **Hero Section** (Full viewport height on desktop, 60vh on mobile)
2. **Registration Form** (Centered, max-width container)
3. **Footer** (Existing component)

## Components and Interfaces

### 1. HeroSection Component

```typescript
interface HeroSectionProps {
  earnings: {
    amount: string;
    period: string;
    currency: string;
  };
  backgroundImage: string;
  ctaText: string;
  onCtaClick: () => void;
}
```

**Features:**
- Gradient overlay for text readability
- Responsive background image with proper aspect ratios
- Animated earnings counter
- Smooth scroll to form on CTA click

### 2. RegistrationForm Component

```typescript
interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

interface RegistrationFormProps {
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  isLoading: boolean;
}
```

**Form Fields Layout:**
- Two-column grid for name fields (firstName, lastName)
- Full-width email field
- City dropdown with major Mexican cities
- Phone field with country code selector
- Password field with strength indicator and visibility toggle
- Terms and privacy checkboxes
- Submit button with loading states

### 3. ValidationSystem

```typescript
interface ValidationRule {
  field: keyof RegistrationFormData;
  validator: (value: any) => boolean;
  message: string;
}

interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  touched: Record<string, boolean>;
}
```

**Validation Rules:**
- Email: RFC 5322 compliant format
- Password: Minimum 8 characters, at least one uppercase, one lowercase, one number
- Phone: Mexican phone number format validation
- Names: Minimum 2 characters, no numbers or special characters
- City: Must be selected from dropdown options

## Data Models

### RegistrationFormData Model

```typescript
interface RegistrationFormData {
  // Personal Information
  firstName: string;          // Required, 2-50 characters
  lastName: string;           // Required, 2-50 characters
  email: string;              // Required, valid email format
  
  // Contact Information
  phone: string;              // Required, Mexican format
  city: string;               // Required, from predefined list
  
  // Security
  password: string;           // Required, 8+ chars with complexity
  
  // Legal Compliance
  termsAccepted: boolean;     // Required, must be true
  privacyAccepted: boolean;   // Required, must be true
}
```

### City Options Model

```typescript
interface CityOption {
  value: string;
  label: string;
  state: string;
}

const MEXICAN_CITIES: CityOption[] = [
  { value: 'cdmx', label: 'Ciudad de México', state: 'CDMX' },
  { value: 'guadalajara', label: 'Guadalajara', state: 'Jalisco' },
  { value: 'monterrey', label: 'Monterrey', state: 'Nuevo León' },
  { value: 'puebla', label: 'Puebla', state: 'Puebla' },
  { value: 'tijuana', label: 'Tijuana', state: 'Baja California' },
  // ... more cities
];
```

## Error Handling

### Validation Error Display

```typescript
interface ErrorDisplayProps {
  field: string;
  error?: string;
  touched: boolean;
}
```

**Error Handling Strategy:**
- Real-time validation on blur for better UX
- Inline error messages below each field
- Error state styling (red borders, error icons)
- Form-level error summary for submission failures
- Network error handling with retry mechanisms

### Error States

1. **Field Validation Errors**: Displayed inline below each field
2. **Form Submission Errors**: Displayed at the top of the form
3. **Network Errors**: Toast notifications with retry options
4. **Server Errors**: Friendly error messages with support contact

## Testing Strategy

### Unit Tests

1. **Form Validation Tests**
   - Test each validation rule independently
   - Test edge cases (empty strings, special characters)
   - Test email format validation
   - Test password strength validation

2. **Component Rendering Tests**
   - Test hero section renders with correct props
   - Test form fields render correctly
   - Test error states display properly
   - Test loading states work correctly

3. **User Interaction Tests**
   - Test form submission flow
   - Test checkbox interactions
   - Test dropdown selections
   - Test password visibility toggle

### Integration Tests

1. **Form Submission Flow**
   - Test complete registration process
   - Test validation error handling
   - Test success state transitions
   - Test network error scenarios

2. **Responsive Design Tests**
   - Test layout on different screen sizes
   - Test touch interactions on mobile
   - Test form usability on small screens

### E2E Tests

1. **Complete Registration Journey**
   - Test user can complete full registration
   - Test form persistence across page refreshes
   - Test error recovery scenarios
   - Test success confirmation flow

## Visual Design Specifications

### Color Palette

```css
:root {
  --primary-pink: #e4007c;
  --primary-pink-hover: #c6006b;
  --primary-pink-light: #fef2f9;
  --success-green: #10b981;
  --error-red: #ef4444;
  --warning-yellow: #f59e0b;
  --neutral-gray-50: #f9fafb;
  --neutral-gray-100: #f3f4f6;
  --neutral-gray-600: #4b5563;
  --neutral-gray-800: #1f2937;
  --neutral-gray-900: #111827;
}
```

### Typography

```css
/* Headlines */
.hero-headline {
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--neutral-gray-900);
}

/* Form Labels */
.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neutral-gray-700);
}

/* Input Fields */
.form-input {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--neutral-gray-900);
}
```

### Spacing and Layout

```css
/* Container Widths */
.hero-container { max-width: 1200px; }
.form-container { max-width: 600px; }

/* Spacing Scale */
.space-xs { margin: 0.5rem; }
.space-sm { margin: 1rem; }
.space-md { margin: 1.5rem; }
.space-lg { margin: 2rem; }
.space-xl { margin: 3rem; }
```

### Responsive Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## Accessibility Considerations

### WCAG 2.1 AA Compliance

1. **Color Contrast**: All text meets 4.5:1 contrast ratio
2. **Keyboard Navigation**: Full keyboard accessibility
3. **Screen Reader Support**: Proper ARIA labels and descriptions
4. **Focus Management**: Clear focus indicators and logical tab order

### Implementation Details

```typescript
// ARIA Labels for Form Fields
const ariaLabels = {
  firstName: 'Nombre de pila',
  lastName: 'Apellido',
  email: 'Correo electrónico',
  phone: 'Número de teléfono',
  city: 'Ciudad de residencia',
  password: 'Contraseña',
  termsCheckbox: 'Acepto términos y condiciones',
  privacyCheckbox: 'Acepto política de privacidad'
};
```

## Performance Optimizations

### Image Optimization

- Hero background image: WebP format with JPEG fallback
- Responsive images with srcset for different screen sizes
- Lazy loading for non-critical images
- Image compression and optimization

### Code Splitting

- Lazy load form validation libraries
- Dynamic imports for non-critical components
- Bundle size optimization

### Caching Strategy

- Static assets cached with long TTL
- Form data persistence in localStorage
- API response caching where appropriate

## Security Considerations

### Data Protection

1. **Input Sanitization**: All user inputs sanitized before processing
2. **HTTPS Only**: All form submissions over secure connections
3. **CSRF Protection**: Cross-site request forgery protection
4. **Rate Limiting**: Prevent form submission abuse

### Privacy Compliance

1. **GDPR Compliance**: Clear consent mechanisms
2. **Data Minimization**: Only collect necessary information
3. **Secure Storage**: Encrypted data storage and transmission
4. **User Rights**: Clear privacy policy and data handling practices

## Implementation Notes

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS for utility-first styling
- **Validation**: React Hook Form with Zod schema validation
- **State Management**: React useState and useReducer
- **Icons**: Heroicons for consistent iconography

### File Structure

```
app/repartidores/
├── page.tsx (main page component)
├── components/
│   ├── HeroSection.tsx
│   ├── RegistrationForm.tsx
│   ├── FormField.tsx
│   └── ValidationMessage.tsx
├── hooks/
│   ├── useFormValidation.ts
│   └── useRegistration.ts
└── utils/
    ├── validation.ts
    └── constants.ts
```

### Integration Points

- **Authentication**: Supabase Auth integration
- **Database**: User registration data storage
- **Email**: Welcome email and verification flow
- **Analytics**: Form completion and conversion tracking