# Placeholder Translation Update

## Summary
Updated BilingualTextField placeholders to use language-specific text instead of the same placeholder for both Arabic and English fields.

## Changes Made

### 1. YearTermDialogs.tsx - Academic Year Dialog
**Before:**
```tsx
placeholder={{
  ar: t("name_placeholder"),  // "e.g., 2024-2025"
  en: t("name_placeholder"),  // "e.g., 2024-2025"
}}
```

**After:**
```tsx
placeholder={{
  ar: "مثال: ٢٠٢٤-٢٠٢٥",      // Arabic example with Arabic numerals
  en: "e.g., 2024-2025",       // English example
}}
```

### 2. YearTermDialogs.tsx - Term Dialog
**Before:**
```tsx
placeholder={{
  ar: t("name_placeholder"),  // "e.g., Term 1"
  en: t("name_placeholder"),  // "e.g., Term 1"
}}
```

**After:**
```tsx
placeholder={{
  ar: "مثال: الفصل الأول",     // "Example: First Term" in Arabic
  en: "e.g., Term 1",          // English example
}}
```

### 3. SubjectDialog.tsx - Subject Name
**Before:**
```tsx
placeholder={{
  ar: t("fields.name_placeholder"),  // "e.g., Mathematics"
  en: t("fields.name_placeholder"),  // "e.g., Mathematics"
}}
```

**After:**
```tsx
placeholder={{
  ar: "مثال: الرياضيات",       // "Example: Mathematics" in Arabic
  en: "e.g., Mathematics",     // English example
}}
```

## Components Without Placeholders

The following components use BilingualTextField but don't have placeholders (which is fine):
- DetailsPanel.tsx (Stage/Grade/Section editing)
- AcademicStructurePage.tsx (Add modal)
- CurriculumEditor.tsx (Unit/Lesson editing)

## Benefits

1. **Better UX**: Users see examples in their native language
2. **Clearer Guidance**: Arabic users see Arabic examples with proper formatting
3. **Consistency**: Matches the input direction (RTL for Arabic, LTR for English)
4. **Cultural Appropriateness**: Uses Arabic numerals (٢٠٢٤) in Arabic placeholders

## Visual Example

**Arabic Field:**
```
اسم المادة (عربي) *
┌─────────────────────────────────┐
│ مثال: الرياضيات                 │  ← Arabic placeholder
└─────────────────────────────────┘
```

**English Field:**
```
اسم المادة (English) *
┌─────────────────────────────────┐
│ e.g., Mathematics               │  ← English placeholder
└─────────────────────────────────┘
```

## Files Modified

1. `src/components/features/academics/components/dialogs/YearTermDialogs.tsx`
2. `src/components/features/academics/components/subjects/SubjectDialog.tsx`

## Testing

- [x] TypeScript compilation passes
- [ ] Manual testing: Verify placeholders appear correctly in both fields
- [ ] Manual testing: Verify Arabic placeholders use Arabic numerals
- [ ] Manual testing: Verify placeholders disappear when user starts typing

## Notes

- Hardcoded placeholders are used instead of translation keys for simplicity
- Arabic numerals (٢٠٢٤) are used in Arabic placeholders for authenticity
- The word "مثال" (example) is used consistently in Arabic placeholders
