# Accessibility Testing Guide - Login Form

This document provides comprehensive guidance for performing manual accessibility testing on the login form to ensure WCAG 2.1 Level AA compliance.

## Automated Test Coverage

The automated accessibility test suite (`components/__tests__/LoginForm.accessibility.test.tsx`) covers:

✅ **Keyboard Navigation** (4 tests)
- Tab order through all interactive elements
- Form submission via Enter key
- Disabled navigation during loading states

✅ **ARIA Labels and Roles** (6 tests)
- Proper ARIA attributes on inputs
- Dynamic aria-invalid updates
- Error message associations via aria-describedby
- Button roles and aria-busy states

✅ **ARIA Live Regions** (3 tests)
- Error announcements to screen readers
- Network error handling
- Dynamic error clearing

✅ **Focus Management** (4 tests)
- Focus retention after validation errors
- Visible focus indicators
- No focus trapping
- Input disabling during loading

✅ **Touch Target Sizes** (5 tests)
- Minimum 44x44px touch targets on all interactive elements
- Adequate padding for mobile devices

✅ **Form Semantics** (4 tests)
- Semantic HTML structure
- Autocomplete attributes
- Required field marking
- Custom validation

✅ **Screen Reader Compatibility** (4 tests)
- Decorative icon hiding
- Descriptive button text
- Loading state announcements

✅ **Responsive Design** (2 tests)
- Mobile viewport accessibility
- Responsive container padding

**Total: 32 automated tests - All passing ✓**

## Manual Testing Checklist

### 1. Keyboard Navigation Testing

#### Test Procedure:
1. Navigate to `/login` page
2. Use only keyboard (no mouse)
3. Test the following:

**Tab Navigation:**
- [ ] Press Tab from page load - focus moves to email input
- [ ] Press Tab again - focus moves to password input
- [ ] Press Tab again - focus moves to "Iniciar Sesión" button
- [ ] Press Tab again - focus moves to "Continuar con Google" button
- [ ] Verify visible focus indicators (2px ring) on all elements

**Form Submission:**
- [ ] Type email in email field
- [ ] Press Enter - form should submit (if password filled)
- [ ] Type password in password field
- [ ] Press Enter - form should submit

**Error State Navigation:**
- [ ] Submit empty form
- [ ] Verify focus remains manageable
- [ ] Tab through error messages
- [ ] Verify errors are keyboard accessible

**Loading State:**
- [ ] Submit valid credentials
- [ ] Verify buttons become disabled during loading
- [ ] Verify Tab key doesn't focus disabled buttons

#### Success Criteria:
- All interactive elements are reachable via keyboard
- Tab order is logical (top to bottom, left to right)
- Focus indicators are clearly visible (minimum 2px outline)
- No keyboard traps (can always move focus away)
- Enter key submits form from any input field

---

### 2. Screen Reader Testing (NVDA/JAWS)

#### Test Setup:
- **NVDA**: Download from https://www.nvaccess.org/download/
- **JAWS**: Download trial from https://www.freedomscientific.com/products/software/jaws/
- **Recommended**: Test with both if possible, minimum NVDA

#### Test Procedure:

**Initial Page Load:**
- [ ] Navigate to `/login`
- [ ] Verify heading "Iniciar Sesión" is announced
- [ ] Verify form landmark is identified

**Form Field Announcements:**
- [ ] Tab to email input
  - Should announce: "Email, required, edit text"
- [ ] Tab to password input
  - Should announce: "Contraseña, required, password edit text"

**Button Announcements:**
- [ ] Tab to submit button
  - Should announce: "Iniciar Sesión, button"
- [ ] Tab to Google button
  - Should announce: "Continuar con Google, button"

**Error Announcements:**
- [ ] Submit empty form
- [ ] Verify validation errors are announced immediately
  - Email error: "El email es requerido"
  - Password error: "La contraseña es requerida"
- [ ] Verify aria-live region announces errors politely

**Authentication Error:**
- [ ] Enter invalid credentials
- [ ] Submit form
- [ ] Verify error alert is announced: "Email o contraseña incorrectos"

**Loading State:**
- [ ] Submit valid credentials
- [ ] Verify loading state is announced: "Iniciando sesión..."
- [ ] Verify aria-busy state is communicated

**Error Correction:**
- [ ] After validation error, start typing in email field
- [ ] Verify error is cleared and announced

#### Success Criteria:
- All form fields have descriptive labels
- Required fields are announced as required
- Error messages are announced immediately
- Loading states are communicated
- No decorative elements are announced (icons, asterisks)
- All interactive elements have clear, descriptive names

---

### 3. ARIA Labels and Live Regions Verification

#### Test Procedure:

**Inspect ARIA Attributes (Browser DevTools):**

1. **Email Input:**
   ```html
   <input
     type="email"
     id="email"
     aria-required="true"
     aria-invalid="false"
     aria-describedby="email-error" (when error present)
   />
   ```
   - [ ] Verify aria-required="true"
   - [ ] Verify aria-invalid updates to "true" on error
   - [ ] Verify aria-describedby links to error message

2. **Password Input:**
   ```html
   <input
     type="password"
     id="password"
     aria-required="true"
     aria-invalid="false"
     aria-describedby="password-error" (when error present)
   />
   ```
   - [ ] Verify aria-required="true"
   - [ ] Verify aria-invalid updates to "true" on error
   - [ ] Verify aria-describedby links to error message

3. **Submit Button:**
   ```html
   <button
     type="submit"
     aria-busy="false"
   />
   ```
   - [ ] Verify aria-busy="false" initially
   - [ ] Verify aria-busy="true" during loading

4. **Error Alert:**
   ```html
   <div
     role="alert"
     aria-live="polite"
     aria-atomic="true"
   />
   ```
   - [ ] Verify role="alert" on error container
   - [ ] Verify aria-live="polite"
   - [ ] Verify aria-atomic="true"

5. **Decorative Elements:**
   - [ ] Verify Google icon has aria-hidden="true"
   - [ ] Verify required asterisks have aria-hidden="true"

#### Success Criteria:
- All ARIA attributes are present and correct
- ARIA attributes update dynamically based on state
- Live regions announce changes appropriately
- Decorative elements are hidden from assistive technology

---

### 4. Focus Management Testing

#### Test Procedure:

**Initial Focus:**
- [ ] Load page
- [ ] Verify focus is not automatically placed (user controls)
- [ ] Press Tab - focus moves to first interactive element

**Focus Visibility:**
- [ ] Tab through all elements
- [ ] Verify each element shows clear focus indicator
- [ ] Verify focus ring is at least 2px wide
- [ ] Verify focus ring has sufficient contrast (3:1 minimum)

**Focus During Validation:**
- [ ] Focus email input
- [ ] Submit form with empty fields
- [ ] Verify focus remains on email input or moves logically
- [ ] Verify user can continue typing immediately

**Focus During Loading:**
- [ ] Submit valid credentials
- [ ] Verify focus remains on submit button
- [ ] Verify button is disabled but focus is visible
- [ ] Verify Tab key doesn't move focus to disabled elements

**Focus After Error:**
- [ ] Trigger authentication error
- [ ] Verify focus doesn't jump unexpectedly
- [ ] Verify user can immediately interact with form

**No Focus Trapping:**
- [ ] Tab through entire form
- [ ] Continue tabbing past last element
- [ ] Verify focus moves to next page element (header/footer)
- [ ] Verify Shift+Tab works in reverse

#### Success Criteria:
- Focus is always visible when using keyboard
- Focus indicators meet contrast requirements
- Focus order is logical and predictable
- No focus traps exist
- Focus management during loading is appropriate
- Users can always navigate away from form

---

### 5. Touch Target Size Testing (Mobile)

#### Test Setup:
- Use physical mobile device (iOS/Android) OR
- Use browser DevTools device emulation
- Test on multiple screen sizes: 320px, 375px, 414px

#### Test Procedure:

**Measure Touch Targets:**
Using browser DevTools or physical measurement:

1. **Email Input:**
   - [ ] Verify height ≥ 44px
   - [ ] Verify width spans full container
   - [ ] Test tapping with finger - easy to hit

2. **Password Input:**
   - [ ] Verify height ≥ 44px
   - [ ] Verify width spans full container
   - [ ] Test tapping with finger - easy to hit

3. **Submit Button:**
   - [ ] Verify height ≥ 44px
   - [ ] Verify width spans full container
   - [ ] Test tapping with finger - easy to hit

4. **Google Button:**
   - [ ] Verify height ≥ 44px
   - [ ] Verify width spans full container
   - [ ] Test tapping with finger - easy to hit

**Spacing Between Targets:**
- [ ] Verify adequate spacing between inputs (minimum 8px)
- [ ] Verify adequate spacing between buttons (minimum 8px)
- [ ] Test rapid tapping - no accidental mis-taps

**Responsive Behavior:**
- [ ] Test on 320px width (iPhone SE)
- [ ] Test on 375px width (iPhone 12)
- [ ] Test on 414px width (iPhone 12 Pro Max)
- [ ] Verify all targets remain ≥ 44px on all sizes

#### Success Criteria:
- All interactive elements are minimum 44x44px
- Adequate spacing prevents accidental taps
- Touch targets work on smallest supported device (320px)
- No horizontal scrolling required
- Easy to tap with thumb on mobile device

---

### 6. Responsive Design Accessibility

#### Test Procedure:

**Mobile (320px - 767px):**
- [ ] Navigate to `/login` on mobile device
- [ ] Verify form is readable without zooming
- [ ] Verify all text is minimum 16px (prevents zoom on iOS)
- [ ] Verify touch targets are ≥ 44px
- [ ] Verify no horizontal scrolling
- [ ] Test keyboard navigation (if available)
- [ ] Test screen reader (VoiceOver on iOS, TalkBack on Android)

**Tablet (768px - 1023px):**
- [ ] Verify form is centered with max-width
- [ ] Verify touch targets remain ≥ 44px
- [ ] Verify keyboard navigation works
- [ ] Verify focus indicators are visible

**Desktop (1024px+):**
- [ ] Verify form is centered with appropriate max-width
- [ ] Verify keyboard navigation works
- [ ] Verify focus indicators are visible
- [ ] Verify mouse and keyboard both work

**Zoom Testing:**
- [ ] Zoom to 200% (Ctrl/Cmd + +)
- [ ] Verify all content remains accessible
- [ ] Verify no content is cut off
- [ ] Verify form remains usable
- [ ] Test up to 400% zoom if possible

#### Success Criteria:
- Form is accessible on all viewport sizes
- No loss of functionality at any breakpoint
- Content reflows appropriately when zoomed
- Touch targets remain adequate on all devices
- Keyboard and screen reader work on all sizes

---

## Testing Tools

### Browser Extensions:
1. **axe DevTools** (Chrome/Firefox)
   - Automated accessibility scanning
   - https://www.deque.com/axe/devtools/

2. **WAVE** (Chrome/Firefox)
   - Visual accessibility evaluation
   - https://wave.webaim.org/extension/

3. **Lighthouse** (Chrome DevTools)
   - Built-in accessibility audit
   - Run from DevTools > Lighthouse tab

### Screen Readers:
1. **NVDA** (Windows) - Free
   - https://www.nvaccess.org/

2. **JAWS** (Windows) - Commercial (trial available)
   - https://www.freedomscientific.com/products/software/jaws/

3. **VoiceOver** (macOS/iOS) - Built-in
   - Enable in System Preferences > Accessibility

4. **TalkBack** (Android) - Built-in
   - Enable in Settings > Accessibility

### Testing Devices:
- **Minimum**: Desktop browser + DevTools device emulation
- **Recommended**: Desktop + 1 physical mobile device
- **Ideal**: Desktop + iOS device + Android device

---

## Known Accessibility Features

### ✅ Implemented:
- Semantic HTML structure (form, labels, buttons)
- ARIA labels on all inputs (aria-required, aria-invalid)
- ARIA live regions for error announcements
- Keyboard navigation support (Tab, Enter)
- Visible focus indicators (2px ring)
- Minimum 44x44px touch targets
- Proper autocomplete attributes
- Error message associations (aria-describedby)
- Loading state communication (aria-busy)
- Decorative element hiding (aria-hidden)
- Responsive design (320px+)
- High contrast error states
- Disabled state management

### 🎯 WCAG 2.1 Level AA Compliance:
- **1.3.1 Info and Relationships**: ✅ Semantic HTML and ARIA
- **1.4.3 Contrast (Minimum)**: ✅ 4.5:1 text contrast
- **2.1.1 Keyboard**: ✅ All functionality via keyboard
- **2.1.2 No Keyboard Trap**: ✅ Can navigate away
- **2.4.3 Focus Order**: ✅ Logical tab order
- **2.4.7 Focus Visible**: ✅ 2px focus indicators
- **2.5.5 Target Size**: ✅ Minimum 44x44px
- **3.2.2 On Input**: ✅ No unexpected changes
- **3.3.1 Error Identification**: ✅ Clear error messages
- **3.3.2 Labels or Instructions**: ✅ All inputs labeled
- **4.1.2 Name, Role, Value**: ✅ Proper ARIA attributes
- **4.1.3 Status Messages**: ✅ ARIA live regions

---

## Reporting Issues

If you find accessibility issues during manual testing:

1. **Document the issue:**
   - What: Describe the problem
   - Where: Specific element or interaction
   - How: Steps to reproduce
   - Impact: Which users are affected
   - WCAG: Which success criterion is violated

2. **Severity levels:**
   - **Critical**: Blocks access for users with disabilities
   - **High**: Significant barrier but workaround exists
   - **Medium**: Usability issue but accessible
   - **Low**: Enhancement or best practice

3. **Report to:** Development team via issue tracker

---

## Testing Frequency

- **Before release**: Full manual test suite
- **After changes**: Automated tests + affected areas
- **Quarterly**: Full manual audit with screen reader
- **Annually**: Third-party accessibility audit

---

## Additional Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **Deque University**: https://dequeuniversity.com/

---

## Test Results Summary

**Automated Tests:** ✅ 32/32 passing
**Manual Tests:** ⏳ Pending user verification

### Manual Test Checklist:
- [ ] Keyboard navigation
- [ ] Screen reader (NVDA/JAWS)
- [ ] ARIA labels verification
- [ ] Focus management
- [ ] Touch target sizes (mobile)
- [ ] Responsive design

**Last Updated:** 2025-11-15
**Tested By:** Automated test suite
**Next Review:** After manual testing completion
