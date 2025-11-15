# Testing Scripts

This directory contains comprehensive testing scripts for validating the UI/UX enhancements implemented in the Doña Repartos platform.

## Available Scripts

### Master Test Suite
```bash
npm run test:all
```
Displays an overview of all testing procedures and quick start commands.

### Individual Test Scripts

#### 1. Responsive Testing
```bash
npm run test:responsive
```
Provides a comprehensive checklist for testing responsive design across all breakpoints (375px, 640px, 1024px, 1440px).

**What it tests:**
- Layout adaptation across breakpoints
- Typography scaling
- Touch target sizes (48x48px minimum)
- Image and media responsiveness
- Spacing consistency

#### 2. Performance Testing
```bash
npm run test:performance
```
Guides you through performance testing using Lighthouse and other tools.

**What it tests:**
- Lighthouse Performance Score (target: > 90)
- Core Web Vitals (FCP, LCP, CLS, TTI, TBT)
- Image optimization
- CSS and JavaScript performance
- Layout stability

#### 3. Accessibility Testing
```bash
npm run test:accessibility
```
Provides comprehensive accessibility testing procedures for WCAG 2.1 AA compliance.

**What it tests:**
- Keyboard navigation
- Color contrast ratios (4.5:1 minimum)
- Screen reader compatibility
- Form accessibility
- Content structure
- Motion and animation preferences

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Run all test guides:**
   ```bash
   npm run test:all
   ```

3. **Follow individual test procedures:**
   ```bash
   npm run test:responsive
   npm run test:performance
   npm run test:accessibility
   ```

## Automated Testing Tools

Install recommended testing tools:
```bash
npm install -D @axe-core/cli pa11y lighthouse
```

Run automated scans:
```bash
# Accessibility scan with axe
npx axe http://localhost:3000

# Accessibility scan with Pa11y
npx pa11y http://localhost:3000

# Performance audit with Lighthouse
npx lighthouse http://localhost:3000 --view
```

## Production Testing

Before deploying, test the production build:

```bash
# Build production version
npm run build

# Start production server
npm start

# Run Lighthouse on production build
npx lighthouse http://localhost:3000 --view
```

## Documentation

For complete testing documentation, see:
- **Testing Summary**: `.kiro/specs/ui-ux-enhancement/testing-summary.md`
- **Design Document**: `.kiro/specs/ui-ux-enhancement/design.md`
- **Requirements**: `.kiro/specs/ui-ux-enhancement/requirements.md`

## Testing Checklist

### Before Deployment
- [ ] Run responsive testing at all breakpoints
- [ ] Verify no horizontal overflow
- [ ] Build production version
- [ ] Run Lighthouse audit (score > 90)
- [ ] Verify Core Web Vitals
- [ ] Run automated accessibility scans
- [ ] Perform keyboard navigation test
- [ ] Test with screen reader
- [ ] Verify contrast ratios
- [ ] Test zoom functionality (up to 200%)
- [ ] Test with reduced motion enabled
- [ ] Cross-browser testing
- [ ] Mobile device testing

## Browser Support

Test on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)

## Support

For questions or issues with testing procedures, refer to the comprehensive testing summary document or the design specifications.
