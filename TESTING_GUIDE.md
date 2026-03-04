# Testing Guide

## Overview
This project uses a comprehensive testing stack to ensure code quality and prevent regressions:

- **Vitest** + **React Testing Library** for unit and component tests
- **Playwright** for end-to-end (E2E) tests

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Tests

#### Unit & Component Tests
```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

#### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

#### Run All Tests
```bash
npm run test:all
```

## Test Structure

### Unit & Component Tests
Located in `__tests__` folders next to the components:

```
src/
├── components/
│   ├── ui/
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   └── __tests__/
│   │   │       └── Button.test.tsx
│   │   └── data-table/
│   │       ├── DataTable.tsx
│   │       └── __tests__/
│   │           └── DataTable.test.tsx
│   └── navigation/
│       ├── GuardedLink.tsx
│       └── __tests__/
│           └── GuardedLink.test.tsx
```

### E2E Tests
Located in the `e2e/` folder:

```
e2e/
├── navigation.spec.ts
├── data-table.spec.ts
├── responsive.spec.ts
└── ...
```

## Writing Tests

### Component Tests

#### Basic Component Test
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Testing User Interactions
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Testing Async Behavior
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AsyncComponent from '../AsyncComponent';

describe('AsyncComponent', () => {
  it('loads data', async () => {
    render(<AsyncComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

#### Basic Navigation Test
```typescript
import { test, expect } from '@playwright/test';

test('navigates to dashboard', async ({ page }) => {
  await page.goto('/en/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
});
```

#### Testing User Flows
```typescript
import { test, expect } from '@playwright/test';

test('user can filter applications', async ({ page }) => {
  await page.goto('/en/admissions/applications');
  
  // Fill search input
  await page.fill('input[type="text"]', 'John');
  
  // Check results
  await expect(page.locator('table')).toContainText('John');
});
```

#### Testing Responsive Design
```typescript
import { test, expect } from '@playwright/test';

test('displays mobile menu on small screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/en/dashboard');
  
  const menuButton = page.locator('button[aria-label="menu"]');
  await expect(menuButton).toBeVisible();
});
```

## Test Patterns

### Mocking

#### Mock Next.js Router
```tsx
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/en/dashboard',
  useParams: () => ({ lang: 'en' }),
}));
```

#### Mock API Calls
```tsx
vi.mock('@/services/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] })),
}));
```

### Testing Accessibility

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Coverage

### View Coverage Report
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Coverage Thresholds
We aim for:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Best Practices

### 1. Test Behavior, Not Implementation
```tsx
// ❌ Bad - Testing implementation details
expect(component.state.count).toBe(1);

// ✅ Good - Testing behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 2. Use Semantic Queries
```tsx
// ❌ Bad
screen.getByTestId('submit-button');

// ✅ Good
screen.getByRole('button', { name: /submit/i });
```

### 3. Keep Tests Simple
```tsx
// ❌ Bad - Too complex
it('does everything', () => {
  // 50 lines of test code
});

// ✅ Good - Focused tests
it('renders title', () => { /* ... */ });
it('handles click', () => { /* ... */ });
it('validates input', () => { /* ... */ });
```

### 4. Use Descriptive Test Names
```tsx
// ❌ Bad
it('works', () => { /* ... */ });

// ✅ Good
it('displays error message when email is invalid', () => { /* ... */ });
```

### 5. Arrange-Act-Assert Pattern
```tsx
it('increments counter when button is clicked', () => {
  // Arrange
  render(<Counter />);
  
  // Act
  fireEvent.click(screen.getByRole('button', { name: /increment/i }));
  
  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

## Debugging Tests

### Debug Component Tests
```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --grep "Button"

# Run with UI
npm run test:ui
```

### Debug E2E Tests
```bash
# Run specific test file
npm run test:e2e -- navigation.spec.ts

# Debug mode (step through)
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed
```

## Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout in test or config
```tsx
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Issue: Element not found
**Solution**: Use `waitFor` for async elements
```tsx
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Issue: Mock not working
**Solution**: Ensure mock is defined before import
```tsx
vi.mock('./module', () => ({ /* ... */ }));
import Component from './Component'; // Import after mock
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Example Test Files

See the following for examples:
- `src/components/ui/button/__tests__/Button.test.tsx`
- `src/components/ui/data-table/__tests__/DataTable.test.tsx`
- `src/components/navigation/__tests__/GuardedLink.test.tsx`
- `e2e/navigation.spec.ts`
- `e2e/data-table.spec.ts`
- `e2e/responsive.spec.ts`
