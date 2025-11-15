# Design Document - UI/UX Enhancement

## Overview

Este documento detalla el diseño de las mejoras de UI/UX para la plataforma Doña Repartos. El enfoque es crear una experiencia visual moderna, coherente y accesible que mejore la percepción de marca y facilite la interacción del usuario sin alterar la funcionalidad existente.

### Design Principles

1. **Mobile-First**: Diseñar primero para móviles, luego escalar a desktop
2. **Consistency**: Mantener patrones visuales consistentes en toda la plataforma
3. **Clarity**: Priorizar la claridad sobre la complejidad visual
4. **Performance**: Optimizar para carga rápida y animaciones fluidas
5. **Accessibility**: Garantizar usabilidad para todos los usuarios

## Architecture

### Design System Foundation

El diseño se basa en un sistema de diseño cohesivo que incluye:

- **Tokens de diseño**: Variables CSS para colores, espaciado, tipografía
- **Componentes reutilizables**: Patrones UI consistentes
- **Responsive breakpoints**: Sistema de grillas adaptativo
- **Sistema de elevación**: Sombras consistentes para profundidad

### Visual Hierarchy System

```
Level 1 (Highest): Hero titles, Primary CTAs
Level 2: Section headings, Secondary CTAs
Level 3: Subsection titles, Card headers
Level 4: Body text, Labels
Level 5 (Lowest): Captions, Helper text
```

## Components and Interfaces

### 1. Design Tokens

#### Color Palette

```css
/* Primary Colors */
--color-primary: #e4007c;
--color-primary-hover: #c6006b;
--color-primary-light: #fce4f3;
--color-primary-lighter: #fef2f9;

/* Neutral Colors */
--color-white: #ffffff;
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;

/* Semantic Colors */
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-info: #3b82f6;
--color-info-light: #dbeafe;
```

#### Spacing Scale

```css
/* Spacing tokens based on 4px base unit */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
--spacing-20: 5rem;    /* 80px */
--spacing-24: 6rem;    /* 96px */
```

#### Typography Scale

```css
/* Font sizes using modular scale (1.25 ratio) */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

#### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Circular */
```

#### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### 2. Component Specifications

#### Button Component

**Primary Button**
```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 0.75rem 2rem;
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  min-height: 48px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 0.75rem 2rem;
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  min-height: 48px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary-hover);
}
```

#### Card Component

```css
.card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-8);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.card-header {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-4);
}

.card-body {
  font-size: var(--text-base);
  color: var(--color-gray-600);
  line-height: var(--leading-relaxed);
}
```

#### Input Component

```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--text-base);
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  min-height: 48px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input::placeholder {
  color: var(--color-gray-400);
}

.input-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-2);
}
```

### 3. Layout Specifications

#### Responsive Breakpoints

```css
/* Mobile First Approach */
/* Base styles: Mobile (<640px) */

@media (min-width: 640px) {
  /* Tablet */
}

@media (min-width: 1024px) {
  /* Desktop */
}

@media (min-width: 1280px) {
  /* Large Desktop */
}
```

#### Container System

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-6);
  padding-right: var(--spacing-6);
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

#### Grid System

```css
.grid {
  display: grid;
  gap: var(--spacing-6);
}

/* Mobile: 1 column */
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

/* Tablet: 2 columns */
@media (min-width: 640px) {
  .grid-cols-md-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .grid-cols-lg-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

### 4. Page-Specific Designs

#### Hero Section Enhancement

**Desktop Design:**
- Height: 70vh
- Background: Image with 50% dark overlay
- Content: Centered vertically and horizontally
- Title: 3.5rem (56px), font-weight: 800
- Subtitle: 1.25rem (20px), max-width: 600px
- CTA Group: Flex row with 1rem gap
- Input: 66% width, rounded-full
- Button: 33% width, primary style

**Mobile Design:**
- Height: 60vh
- Title: 2rem (32px), font-weight: 800
- Subtitle: 1rem (16px)
- CTA Group: Flex column with 0.5rem gap
- Input: 100% width
- Button: 100% width

```css
.hero {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: var(--spacing-6);
  max-width: 56rem;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: var(--font-extrabold);
  color: var(--color-white);
  margin-bottom: var(--spacing-4);
  line-height: var(--leading-tight);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--color-white);
  margin-bottom: var(--spacing-8);
  line-height: var(--leading-relaxed);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

@media (min-width: 1024px) {
  .hero {
    min-height: 70vh;
  }
}
```

#### Header Enhancement

**Desktop:**
- Height: 72px
- Sticky positioning with backdrop blur
- Logo: 40px, with text
- Nav links: Horizontal, 1.5rem spacing
- Auth buttons: Inline, right-aligned

**Mobile:**
- Height: 64px
- Hamburger menu: Right side
- Logo: 40px, no text
- Mobile menu: Slide down animation, full width
- Nav links: Vertical stack, 0.5rem spacing

```css
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-white);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 var(--spacing-6);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.header-nav {
  display: none;
}

@media (min-width: 1024px) {
  .header-container {
    height: 72px;
  }
  
  .header-nav {
    display: flex;
    gap: var(--spacing-6);
  }
}

.mobile-menu {
  animation: slideDown 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Section Spacing

```css
.section {
  padding-top: var(--spacing-12);
  padding-bottom: var(--spacing-12);
}

@media (min-width: 1024px) {
  .section {
    padding-top: var(--spacing-20);
    padding-bottom: var(--spacing-20);
  }
}

.section-title {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
  text-align: center;
  margin-bottom: var(--spacing-4);
}

.section-subtitle {
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: var(--color-gray-600);
  text-align: center;
  max-width: 42rem;
  margin: 0 auto var(--spacing-12);
  line-height: var(--leading-relaxed);
}
```

#### "Cómo Funciona" Section

**Design:**
- Background: Gray-50
- Grid: 1 column mobile, 3 columns desktop
- Icon containers: Circular, 80px, primary-light background
- Icons: 40px, primary color
- Spacing between cards: 2rem mobile, 3rem desktop

```css
.how-it-works-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon-container {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-4);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-container:hover {
  transform: scale(1.05);
}

.icon-container svg {
  width: 40px;
  height: 40px;
  color: var(--color-primary);
}

.step-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-2);
}

.step-description {
  font-size: var(--text-base);
  color: var(--color-gray-600);
  line-height: var(--leading-relaxed);
}
```

#### CTA Cards Section

**Design:**
- Grid: 1 column mobile, 2 columns desktop
- Card padding: 2rem mobile, 2.5rem desktop
- Border radius: 1rem
- Restaurant card: Gray-100 background, gray-800 button
- Delivery card: Primary background, white button

```css
.cta-card {
  padding: var(--spacing-8);
  border-radius: var(--radius-xl);
  text-align: center;
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-card:hover {
  transform: translateY(-4px);
}

.cta-card-restaurant {
  background: var(--color-gray-100);
}

.cta-card-delivery {
  background: var(--color-primary);
  color: var(--color-white);
}

.cta-card-title {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  font-weight: var(--font-bold);
  margin-bottom: var(--spacing-4);
}

.cta-card-description {
  font-size: clamp(0.875rem, 2vw, 1rem);
  margin-bottom: var(--spacing-6);
  line-height: var(--leading-relaxed);
}

@media (min-width: 1024px) {
  .cta-card {
    padding: var(--spacing-10);
  }
}
```

#### Testimonials Section

**Design:**
- Background: Gray-50
- Carousel: Single card visible
- Card: White background, shadow-md, 2rem padding
- Avatar: 80px circular
- Stars: Yellow-400, centered
- Navigation: Circular buttons, white background, positioned outside card on desktop

```css
.testimonial-card {
  background: var(--color-white);
  padding: var(--spacing-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  max-width: 48rem;
  margin: 0 auto;
}

.testimonial-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  margin: 0 auto var(--spacing-4);
  border: 3px solid var(--color-primary-light);
}

.testimonial-stars {
  display: flex;
  justify-content: center;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-4);
}

.testimonial-text {
  font-size: var(--text-base);
  color: var(--color-gray-600);
  font-style: italic;
  margin-bottom: var(--spacing-4);
  line-height: var(--leading-relaxed);
}

.testimonial-name {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
}

.testimonial-role {
  font-size: var(--text-sm);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
}

.carousel-button {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-white);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-button:hover {
  background: var(--color-gray-100);
  transform: scale(1.05);
}
```

#### Footer Enhancement

**Design:**
- Background: Gray-800
- Text color: Gray-400
- Link hover: Primary color
- Padding: 2rem mobile, 3rem desktop
- Copyright section: Border-top gray-700

```css
.footer {
  background: var(--color-gray-800);
  color: var(--color-gray-400);
}

.footer-container {
  padding: var(--spacing-8) var(--spacing-6);
}

.footer-brand {
  margin-bottom: var(--spacing-6);
  text-align: center;
}

.footer-title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-white);
  margin-bottom: var(--spacing-2);
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.footer-link {
  font-size: var(--text-sm);
  color: var(--color-gray-400);
  transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.footer-link:hover {
  color: var(--color-primary);
}

.footer-bottom {
  border-top: 1px solid var(--color-gray-700);
  padding-top: var(--spacing-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}

@media (min-width: 1024px) {
  .footer-container {
    padding: var(--spacing-12) var(--spacing-6);
  }
  
  .footer-brand {
    text-align: left;
  }
  
  .footer-bottom {
    flex-direction: row;
    justify-content: space-between;
  }
}
```

## Data Models

No se requieren cambios en los modelos de datos ya que este proyecto se enfoca exclusivamente en mejoras visuales y de UX.

## Error Handling

### Visual Error States

**Form Validation Errors:**
```css
.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px var(--color-error-light);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--color-error);
}
```

**Loading States:**
```css
.button-loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.button-loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  top: 50%;
  left: 50%;
  margin-left: -10px;
  margin-top: -10px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: var(--radius-full);
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Skeleton Loaders:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-200) 25%,
    var(--color-gray-100) 50%,
    var(--color-gray-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Testing Strategy

### Visual Regression Testing

1. **Responsive Testing:**
   - Test en breakpoints: 375px, 640px, 1024px, 1440px
   - Verificar que no haya overflow horizontal
   - Validar que todos los elementos sean accesibles

2. **Cross-Browser Testing:**
   - Chrome, Firefox, Safari, Edge
   - Verificar consistencia de animaciones
   - Validar renderizado de sombras y gradientes

3. **Accessibility Testing:**
   - Contrast ratio mínimo 4.5:1 (WCAG AA)
   - Navegación por teclado funcional
   - Focus states visibles
   - Screen reader compatibility

4. **Performance Testing:**
   - Lighthouse score > 90 en Performance
   - First Contentful Paint < 1.5s
   - Largest Contentful Paint < 2.5s
   - Cumulative Layout Shift < 0.1

### Manual Testing Checklist

- [ ] Todos los botones tienen estados hover y active
- [ ] Inputs muestran focus states claros
- [ ] Animaciones son suaves (60fps)
- [ ] Imágenes cargan con lazy loading
- [ ] Touch targets son mínimo 48x48px en mobile
- [ ] Texto es legible en todos los fondos
- [ ] Espaciado es consistente entre secciones
- [ ] Tipografía sigue la escala definida
- [ ] Colores siguen la paleta establecida
- [ ] Responsive design funciona en todos los breakpoints

## Implementation Notes

### CSS Architecture

Utilizar CSS Modules o Tailwind CSS para mantener estilos encapsulados y evitar conflictos. Priorizar utility-first approach para rapidez de desarrollo.

### Animation Performance

- Usar `transform` y `opacity` para animaciones (GPU-accelerated)
- Evitar animar `width`, `height`, `top`, `left`
- Usar `will-change` con precaución
- Limitar animaciones simultáneas

### Image Optimization

- Usar Next.js Image component para optimización automática
- Implementar lazy loading para imágenes below-the-fold
- Usar formatos modernos (WebP, AVIF) con fallbacks
- Definir dimensiones explícitas para evitar layout shift

### Accessibility Considerations

- Mantener orden lógico de tabulación
- Proporcionar labels descriptivos
- Usar ARIA attributes cuando sea necesario
- Asegurar que animaciones respeten `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Dark Mode Preparation (Future)

Aunque no se implementa en esta fase, el sistema de tokens está preparado para soportar dark mode mediante CSS custom properties que pueden ser sobrescritas con media query `prefers-color-scheme: dark`.
