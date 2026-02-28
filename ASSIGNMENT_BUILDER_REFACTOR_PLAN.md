# Assignment Builder Refactor - Execution Plan

## Current Issues Identified

### Critical Bugs
1. **State Management**: 1600+ line monolithic component with mixed concerns
2. **Hardcoded Strings**: "واجب جديد", "New Assignment", "Option 1", etc.
3. **Hardcoded Styles**: Colors, spacing, magic numbers throughout
4. **Type Safety**: Multiple `any` types, loose typing
5. **Performance**: No memoization, unnecessary re-renders
6. **Validation**: Scattered validation logic, inconsistent error handling
7. **Data Fetching**: Manual state management, no error boundaries
8. **Accessibility**: Missing ARIA labels, poor keyboard navigation

### Architecture Issues
1. All logic in one 1600+ line file
2. No separation of concerns (data/state/UI)
3. Duplicate code across desktop/mobile layouts
4. No reusable hooks for common operations
5. Mixed responsibilities in components

## Refactor Strategy

### Phase 1: Create Clean Structure ✅
```
src/features/academics/assignments/builder/
├── pages/
│   └── AssignmentBuilderPage.tsx (route wrapper)
├── components/
│   ├── BuilderHeader.tsx
│   ├── QuestionsOutline.tsx
│   ├── QuestionEditor.tsx (enhanced)
│   ├── AssignmentSettingsPanel.tsx
│   ├── AttachmentsPanel.tsx
│   ├── PointsSummary.tsx
│   ├── QuestionCard.tsx
│   ├── OptionsList.tsx
│   └── EmptyStates.tsx
├── hooks/
│   ├── useAssignment.ts
│   ├── useAssignmentQuestions.ts
│   ├── useAssignmentAttachments.ts
│   ├── useAssignmentMutations.ts
│   ├── useAssignmentValidation.ts
│   └── useQuestionEditor.ts
├── utils/
│   ├── validation.ts
│   ├── points.ts
│   └── constants.ts
└── types.ts
```

### Phase 2: Extract Types ✅
- Assignment builder specific types
- Validation error types
- Component prop types
- Hook return types

### Phase 3: Create Custom Hooks ✅
- `useAssignment`: Fetch and manage assignment data
- `useAssignmentQuestions`: Manage questions list
- `useAssignmentAttachments`: Manage attachments
- `useAssignmentMutations`: All mutation operations
- `useAssignmentValidation`: Centralized validation
- `useQuestionEditor`: Question editing state

### Phase 4: Extract Components ✅
Each component with single responsibility:
- BuilderHeader: Navigation, save, publish actions
- QuestionsOutline: Question list with reorder
- QuestionEditor: Question editing form
- AssignmentSettingsPanel: Title, description, dates, max score
- AttachmentsPanel: File uploads and links
- PointsSummary: Points calculation and auto-distribute
- QuestionCard: Individual question in outline
- OptionsList: MCQ options editor
- EmptyStates: No questions, no attachments

### Phase 5: Internationalization ✅
Add all missing translation keys:
- Question type labels
- Validation messages
- Action button labels
- Empty state messages
- Confirmation dialogs

### Phase 6: Fix Critical Bugs ✅
1. State sync when switching questions
2. Points calculation accuracy
3. Option validation (min 2, correct answers)
4. Dirty state tracking
5. Attachment upload restrictions
6. Form validation consistency

### Phase 7: Performance Optimization ✅
- Memoize expensive calculations
- Use React.memo for pure components
- Debounce auto-save properly
- Optimize re-renders

### Phase 8: Accessibility & RTL ✅
- Add ARIA labels
- Keyboard navigation
- Focus management
- RTL layout fixes

## Implementation Order

1. ✅ Create folder structure
2. ✅ Extract types
3. ✅ Create utility functions
4. ✅ Build custom hooks (data layer)
5. ✅ Extract UI components
6. ✅ Wire up components in main page
7. ✅ Add missing translations
8. ✅ Test and fix bugs
9. ✅ Performance optimization
10. ✅ Accessibility audit

## Success Criteria

- [ ] No files over 300 lines
- [ ] No hardcoded strings
- [ ] No `any` types
- [ ] All bugs fixed
- [ ] Full i18n coverage
- [ ] Proper error handling
- [ ] Loading states everywhere
- [ ] Accessible (WCAG AA)
- [ ] RTL works perfectly
- [ ] Build passes with no warnings
- [ ] All existing features work

## Timeline

Given the scope (1600+ lines → ~15 modular files), this is a 2-3 hour refactor.

**Priority**: Start with critical bugs and structure, then polish.

## Notes

- Keep existing API contracts unchanged
- Maintain backward compatibility
- Use existing shared components
- Follow existing patterns in codebase
- Test thoroughly after each phase
