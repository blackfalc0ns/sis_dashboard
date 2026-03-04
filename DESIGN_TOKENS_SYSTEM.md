# Design Tokens System - Implementation Complete

## Overview
Implemented a unified design token system that serves as a single source of truth for all design decisions (colors, spacing, typography, shadows, etc.) across both Tailwind CSS and Material-UI.

## Problem Solved (CR-008)
**Issue**: Mixed Tailwind + MUI without a single token system  
**Severity**: Medium  
**Impact**: 
- Hard to ensure consistency across components
- Multiple sources for spacing and colors
- UI drift and inconsistent look and feel
- Slower iteration on design changes

## Solution Architecture

### 1. Central Token Definition
**File**: `src/design/tokens.ts`

All design decisions are defined once in TypeScript with proper typing:

```typescript
export const tokens = {
  colors: { /* primary, accent, semantic colors */ },
  spacing: { /* 0-64 scale */ },
  typography: { /* fonts, sizes, weights */ },
  borderRadius: { /* sm to full */ },
  shadows: { /* sm to 2xl + custom */ },
  breakpoints: { /* xs to 2xl */ },
  zIndex: { /* semantic layers */ },
  transitions: { /* duration + timing */ },
  borders: { /* width + colors */ },
};
```

### 2. Tailwind Integration
**File**: `tailwind.config.ts`

Tokens are imported and mapped to Tailwind's theme extension:

```typescript
import { tokens } from "./src/design/tokens";

const config: Config = {
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.typography.fontFamily,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      // ... all other tokens
    },
  },
};
```

### 3. MUI Integration
**File**: `src/theme.ts`

Tokens are imported and mapped to MUI's theme structure:

```typescript
import { tokens } from "@/design/tokens";

export const theme = createTheme({
  typography: {
    fontFamily: tokens.typography.fontFamily.sans.join(", "),
    h1: { fontSize: tokens.typography.fontSize["5xl"][0], ... },
    // ... all typography variants
  },
  palette: {
    primary: { main: tokens.colors.primary.DEFAULT, ... },
    // ... all color palettes
  },
  spacing: 8,
  shape: { borderRadius: parseInt(tokens.borderRadius.lg) },
  shadows: [tokens.shadows.sm, tokens.shadows.DEFAULT, ...],
  // ... all other theme properties
});
```

## Design Token Categories

### Colors
- **Primary**: Brand color (#036b80) with 50-950 scale
- **Hover**: Darker primary (#025a6b) with scale
- **Accent**: Orange/gold (#F7A201) with scale
- **Surface**: Background tint (#EAE0CF) with scale
- **Neutral**: Gray tones (#AFADB2) with scale
- **Semantic**: Success, error, warning, info with light/dark variants

### Spacing
Standard scale from 0 to 64 (0px to 256px) following 4px base unit

### Typography
- **Font families**: Cairo (sans), monospace
- **Font sizes**: xs to 6xl with line heights
- **Font weights**: thin to black (100-900)

### Border Radius
- sm (2px) to 3xl (24px) + full (9999px)

### Shadows
- sm to 2xl elevation levels
- Custom "main" shadow for specific use cases

### Breakpoints
- xs: 475px
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

### Z-Index
Semantic layers: dropdown (1000), modal (1050), tooltip (1070), etc.

### Transitions
- **Duration**: 75ms to 1000ms
- **Timing**: linear, in, out, inOut

### Borders
- **Width**: 0, 1px (default), 2px, 4px, 8px
- **Colors**: default, light, dark

## Usage Guidelines

### When to Use Tailwind
Use Tailwind utilities for:
- Layout (flex, grid, positioning)
- Spacing (margin, padding)
- Typography (text size, weight, color)
- Borders and backgrounds
- Responsive design
- Custom component styling

```tsx
<div className="flex gap-4 p-6 bg-primary-50 rounded-xl shadow-md">
  <h2 className="text-2xl font-bold text-primary-600">Title</h2>
</div>
```

### When to Use MUI
Use MUI components for:
- Complex interactive components (Autocomplete, DatePicker, etc.)
- Charts and data visualization
- Components requiring theme-aware styling
- Components with built-in accessibility

```tsx
<Button 
  variant="contained" 
  color="primary"
  sx={{ borderRadius: 2 }}
>
  Click Me
</Button>
```

### Accessing Tokens Directly
For custom logic or dynamic styling:

```typescript
import { tokens } from "@/design/tokens";

const customStyle = {
  color: tokens.colors.primary.DEFAULT,
  padding: tokens.spacing[4],
  borderRadius: tokens.borderRadius.lg,
};
```

## Benefits

### 1. Single Source of Truth
- All design decisions in one place
- Easy to update globally
- No conflicting definitions

### 2. Type Safety
- TypeScript ensures correct token usage
- Autocomplete in IDE
- Compile-time error checking

### 3. Consistency
- Same colors, spacing, typography everywhere
- Predictable component behavior
- Unified look and feel

### 4. Maintainability
- Change once, update everywhere
- Clear documentation
- Easy onboarding for new developers

### 5. Scalability
- Easy to add new tokens
- Can extract to separate package
- Supports design system evolution

## Migration Path

### For Existing Components

1. **Hardcoded colors** → Use token-based classes
   ```tsx
   // Before
   <div style={{ color: '#036b80' }}>
   
   // After
   <div className="text-primary-500">
   ```

2. **Inline styles** → Use Tailwind utilities
   ```tsx
   // Before
   <div style={{ padding: '16px', borderRadius: '8px' }}>
   
   // After
   <div className="p-4 rounded-lg">
   ```

3. **CSS variables** → Can still use, but prefer tokens
   ```tsx
   // Before
   <div style={{ color: 'var(--primary-color)' }}>
   
   // After
   <div className="text-primary">
   ```

### Backward Compatibility
- Existing CSS variables in `globals.css` still work
- Gradual migration recommended
- No breaking changes to existing components

## File Structure

```
src/
├── design/
│   └── tokens.ts          # Central token definition
├── theme.ts               # MUI theme (uses tokens)
├── app/
│   ├── globals.css        # CSS variables (legacy)
│   └── providers.tsx      # MUI ThemeProvider
└── tailwind.config.ts     # Tailwind config (uses tokens)
```

## Examples

### Color Usage
```tsx
// Tailwind
<div className="bg-primary-500 text-white">Primary</div>
<div className="bg-accent-500 text-white">Accent</div>
<div className="border border-primary-200">Border</div>

// MUI
<Button color="primary">Primary</Button>
<Alert severity="success">Success</Alert>
```

### Spacing Usage
```tsx
// Tailwind
<div className="p-4 m-6 gap-3">
<div className="space-y-4">

// MUI (uses 8px base)
<Box sx={{ p: 2, m: 3 }}>  // 16px, 24px
```

### Typography Usage
```tsx
// Tailwind
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base font-normal">Body</p>

// MUI
<Typography variant="h1">Heading</Typography>
<Typography variant="body1">Body</Typography>
```

### Shadow Usage
```tsx
// Tailwind
<div className="shadow-md">Card</div>
<div className="shadow-xl">Modal</div>

// MUI (uses elevation prop)
<Paper elevation={2}>Card</Paper>
<Paper elevation={8}>Modal</Paper>
```

## Best Practices

### 1. Prefer Semantic Names
```tsx
// Good
<div className="bg-primary-500">
<Button color="primary">

// Avoid
<div style={{ backgroundColor: '#036b80' }}>
```

### 2. Use Consistent Spacing
```tsx
// Good - uses spacing scale
<div className="p-4 gap-6">

// Avoid - arbitrary values
<div className="p-[17px] gap-[23px]">
```

### 3. Leverage Theme Variants
```tsx
// Good - uses theme
<Button variant="contained" color="primary">

// Avoid - custom styling
<button style={{ background: '#036b80', color: 'white' }}>
```

### 4. Document Custom Tokens
When adding new tokens, document their purpose:
```typescript
export const colors = {
  // Brand identity color - used for primary actions
  primary: { ... },
};
```

## Testing

### Visual Regression
- Test components with different token values
- Verify consistency across Tailwind and MUI
- Check responsive behavior

### Type Safety
- TypeScript compilation ensures correct usage
- IDE autocomplete helps prevent errors

### Build Verification
```bash
npm run build  # Ensures tokens are properly imported
```

## Future Enhancements

### Potential Additions
1. **Animation tokens**: Keyframes, spring configs
2. **Grid tokens**: Column counts, gutters
3. **Opacity scale**: Standardized transparency values
4. **Theme variants**: Light/dark mode support
5. **Component tokens**: Button sizes, input heights, etc.

### Design System Evolution
- Extract tokens to separate npm package
- Add Storybook for component documentation
- Create design token documentation site
- Implement visual regression testing

## Related Files
- `src/design/tokens.ts` - Token definitions
- `tailwind.config.ts` - Tailwind integration
- `src/theme.ts` - MUI integration
- `src/app/providers.tsx` - Theme provider
- `src/app/globals.css` - Legacy CSS variables

## Validation
- ✅ TypeScript compilation passes
- ✅ Tailwind config valid
- ✅ MUI theme properly configured
- ✅ No breaking changes to existing components
- ✅ Build succeeds

---

**Status**: ✅ Complete  
**Impact**: Medium - Improves maintainability and consistency  
**Breaking Changes**: None - Fully backward compatible
