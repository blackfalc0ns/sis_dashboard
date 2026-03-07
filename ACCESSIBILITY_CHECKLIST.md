# Accessibility Checklist

This checklist ensures WCAG 2.1 Level AA compliance for the SIS Dashboard application.

## 1. Keyboard Navigation ⌨️

### Requirements
- [ ] All interactive elements are keyboard accessible (Tab, Enter, Space, Arrow keys)
- [ ] Tab order follows logical reading order
- [ ] Focus indicators are clearly visible (outline, border, background change)
- [ ] Escape key closes modals, dropdowns, and overlays
- [ ] Enter/Space activates buttons and links
- [ ] Arrow keys navigate within components (dropdowns, tabs, etc.)
- [ ] No keyboard traps (users can always navigate away)

### Testing
```bash
# Manual test: Navigate entire page using only keyboard
# - Tab through all interactive elements
# - Verify focus is visible at all times
# - Test Escape key on modals/dropdowns
# - Test Enter/Space on buttons
```

## 2. Focus Management 🎯

### Requirements
- [ ] Focus is trapped within modals (Tab cycles through modal elements only)
- [ ] Focus returns to trigger element when modal closes
- [ ] Focus moves to first interactive element when modal opens
- [ ] Skip links provided for long content
- [ ] Focus is not lost during dynamic content updates
- [ ] Focus order matches visual order

### Implementation
```typescript
// Use focus trap utility
import { createFocusTrap } from '@/lib/accessibility/focusTrap';

useEffect(() => {
  if (isOpen && modalRef.current) {
    const cleanup = createFocusTrap(modalRef.current);
    return cleanup; // Restores focus on cleanup
  }
}, [isOpen]);
```

## 3. ARIA Labels & Attributes 🏷️

### Requirements
- [ ] All icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels (visible or `aria-label`)
- [ ] Error messages use `aria-describedby` or `aria-errormessage`
- [ ] Loading states use `aria-busy="true"`
- [ ] Expandable sections use `aria-expanded`
- [ ] Modals use `role="dialog"` and `aria-modal="true"`
- [ ] Tabs use proper ARIA tab pattern

### Examples
```typescript
// Icon-only button
<button aria-label="Close modal">
  <X className="w-5 h-5" />
</button>

// Form input with error
<input
  aria-label="Email address"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
<span id="email-error" role="alert">
  {errorMessage}
</span>

// Loading state
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? 'Loading...' : content}
</div>
```

## 4. Live Regions & Announcements 📢

### Requirements
- [ ] Toast notifications use `aria-live="polite"` or `aria-live="assertive"`
- [ ] Dynamic content changes are announced to screen readers
- [ ] Status messages use `role="status"` with `aria-live="polite"`
- [ ] Alerts/errors use `role="alert"` with `aria-live="assertive"`
- [ ] Loading indicators are announced

### Implementation
```typescript
// Toast with ARIA live region
<Alert
  role={severity === 'error' ? 'alert' : 'status'}
  aria-live={severity === 'error' ? 'assertive' : 'polite'}
  aria-atomic="true"
>
  {message}
</Alert>

// Programmatic announcement
import { announceToScreenReader } from '@/lib/accessibility/ariaHelpers';

announceToScreenReader('Data saved successfully', 'polite');
```

## 5. Semantic HTML 📝

### Requirements
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping levels)
- [ ] Buttons use `<button>` element, not `<div>` with click handlers
- [ ] Links use `<a>` with `href` attribute
- [ ] Forms use proper form elements (`<form>`, `<label>`, `<input>`)
- [ ] Lists use `<ul>`/`<ol>`/`<li>` elements
- [ ] Tables use `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- [ ] Landmarks use semantic HTML5 elements (`<nav>`, `<main>`, `<aside>`)

### Anti-patterns to Avoid
```typescript
// ❌ BAD
<div onClick={handleClick}>Click me</div>

// ✅ GOOD
<button onClick={handleClick}>Click me</button>

// ❌ BAD
<div className="link" onClick={navigate}>Go to page</div>

// ✅ GOOD
<a href="/page">Go to page</a>
```

## 6. Color & Contrast 🎨

### Requirements
- [ ] Text has minimum contrast ratio of 4.5:1 (normal text)
- [ ] Large text (18pt+) has minimum contrast ratio of 3:1
- [ ] Focus indicators have minimum contrast ratio of 3:1
- [ ] Color is not the only indicator (use icons, text, patterns)
- [ ] Links are distinguishable from surrounding text
- [ ] UI components have sufficient contrast

### Tools
- Chrome DevTools Lighthouse
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- axe DevTools browser extension

## 7. Responsive & Mobile 📱

### Requirements
- [ ] Touch targets are at least 44x44 CSS pixels
- [ ] Content reflows properly at 200% zoom
- [ ] No horizontal scrolling at mobile sizes
- [ ] Pinch zoom is not disabled (`user-scalable=yes`)
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] Orientation changes are supported

### Testing
```bash
# Test at different zoom levels
# - 100%, 150%, 200%
# Test on different devices
# - Mobile (320px - 480px)
# - Tablet (768px - 1024px)
# - Desktop (1280px+)
```

## 8. Forms & Validation ✅

### Requirements
- [ ] All form inputs have associated labels
- [ ] Required fields are indicated (not just by color)
- [ ] Error messages are clear and specific
- [ ] Errors are announced to screen readers
- [ ] Form submission errors are summarized at top
- [ ] Success messages are announced

### Example
```typescript
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert" className="text-red-600">
    Please enter a valid email address
  </span>
)}
```

## 9. Images & Media 🖼️

### Requirements
- [ ] All images have `alt` text (or `alt=""` for decorative images)
- [ ] Complex images have detailed descriptions
- [ ] Icons have `aria-label` when used without text
- [ ] Videos have captions/subtitles
- [ ] Audio content has transcripts

## 10. Testing Tools 🔧

### Automated Testing
- **axe DevTools**: Browser extension for accessibility testing
- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: Web accessibility evaluation tool
- **Pa11y**: Command-line accessibility testing

### Manual Testing
- **Keyboard Navigation**: Navigate entire site with keyboard only
- **Screen Reader**: Test with NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- **Zoom**: Test at 200% zoom level
- **Color Blindness**: Use browser extensions to simulate color blindness

### Testing Commands
```bash
# Run Lighthouse accessibility audit
npm run lighthouse

# Run axe-core tests (if configured)
npm run test:a11y
```

## Component-Specific Checklists

### Modal Component
- [x] Focus trap implemented
- [x] Focus returns to trigger on close
- [x] Escape key closes modal
- [x] `role="dialog"` and `aria-modal="true"`
- [x] `aria-labelledby` points to title
- [x] `aria-describedby` points to description
- [x] Close button has `aria-label`

### Toast Component
- [x] Uses `aria-live` region
- [x] `role="status"` for info/success
- [x] `role="alert"` for errors/warnings
- [x] `aria-atomic="true"`
- [x] Announces to screen readers

### DataTable Component
- [ ] Table has caption or `aria-label`
- [ ] Headers use `<th>` with `scope` attribute
- [ ] Sortable columns indicate sort direction
- [ ] Pagination controls are keyboard accessible
- [ ] Row selection is announced

### Form Components
- [ ] Labels associated with inputs
- [ ] Error messages use `aria-describedby`
- [ ] Required fields indicated
- [ ] Validation errors announced

## Resources 📚

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)

## Review Process

Before merging any PR:
1. Run automated accessibility tests
2. Perform keyboard navigation test
3. Test with screen reader (at least one)
4. Check color contrast
5. Verify ARIA labels on new components
6. Test at 200% zoom
7. Review against this checklist

## Continuous Improvement

- Schedule quarterly accessibility audits
- Include accessibility in code reviews
- Provide accessibility training for team
- Monitor user feedback for accessibility issues
- Stay updated with WCAG guidelines
