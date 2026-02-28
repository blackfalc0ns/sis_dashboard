# Manual Save Refactor - Implementation Summary

## Status: READY TO IMPLEMENT

Translation keys have been added. The refactoring is ready to proceed.

## What Was Completed

### 1. Translation Keys Added ✅
Added to both `src/messages/en.json` and `src/messages/ar.json`:
- `common.unsaved`: "Unsaved" / "غير محفوظ"
- `common.saveQuestion`: "Save question" / "حفظ السؤال"
- `common.saveAssignment`: "Save assignment" / "حفظ الواجب"
- `common.discard`: "Discard" / "تجاهل"
- `common.saveAndSwitch`: "Save & switch" / "حفظ والمتابعة"
- `common.discardAndSwitch`: "Discard & switch" / "تجاهل والمتابعة"
- `common.unsavedChanges`: "Unsaved changes" / "تغييرات غير محفوظة"
- `common.unsavedChangesMessage`: "Save changes before switching?" / "حفظ التغييرات قبل المتابعة؟"

### 2. Planning Documents Created ✅
- `MANUAL_SAVE_REFACTOR_PLAN.md` - Comprehensive implementation plan
- `MANUAL_SAVE_IMPLEMENTATION_SUMMARY.md` - This document

## Next Steps

Due to the complexity and size of this refactoring (touching 7+ files with significant logic changes), I recommend proceeding in phases:

### Phase 1: Core State Management (AssignmentBuilderPage)
1. Remove auto-save hook imports
2. Add draft state management (assignment + question)
3. Add dirty state computation
4. Implement manual save handlers
5. Add question switching confirmation logic

### Phase 2: QuestionEditor Refactor
1. Remove all auto-save logic (setTimeout, debounce)
2. Convert to controlled component with onChange callbacks
3. Remove onBlur save triggers
4. Add onDirtyChange callback

### Phase 3: UI Updates
1. Update BuilderHeader with new status indicators
2. Add "Save Question" button to DesktopLayout
3. Add "Save Question" button to MobileLayout
4. Update button states and disabled logic

### Phase 4: Testing & Polish
1. Test all save flows
2. Test confirmation dialogs
3. Test dirty state tracking
4. Test global navigation guard
5. Fix any edge cases

## Key Implementation Considerations

### 1. Draft State Management
```typescript
// Single source of truth for drafts
const [assignmentDraft, setAssignmentDraft] = useState<Assignment | null>(null);
const [lastSavedAssignment, setLastSavedAssignment] = useState<Assignment | null>(null);

// Compute dirty state
const isAssignmentDirty = useMemo(() => {
  if (!assignmentDraft || !lastSavedAssignment) return false;
  return JSON.stringify(assignmentDraft) !== JSON.stringify(lastSavedAssignment);
}, [assignmentDraft, lastSavedAssignment]);
```

### 2. Question Switching Guard
```typescript
const handleSelectQuestion = (questionId: string) => {
  if (isQuestionDirty) {
    setSwitchQuestionDialog({
      isOpen: true,
      targetQuestionId: questionId,
    });
  } else {
    setSelectedQuestionId(questionId);
  }
};
```

### 3. Manual Save with Validation
```typescript
const handleSaveQuestion = async () => {
  if (!questionDraft || !isQuestionDirty) return;
  
  // Validate first
  const errors = validateQuestion(questionDraft, tValidation);
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return;
  }
  
  setIsQuestionSaving(true);
  try {
    await updateQuestion(questionDraft.id, questionDraft);
    setLastSavedQuestion(questionDraft);
    setIsQuestionDirty(false);
    showSuccess(tCommon("save_success"));
  } catch (error) {
    showError(tCommon("save_failed"));
  } finally {
    setIsQuestionSaving(false);
  }
};
```

### 4. Global Dirty Tracking Integration
```typescript
useEffect(() => {
  if (isAssignmentDirty || isQuestionDirty) {
    markDirty();
  } else {
    clearDirty();
  }
}, [isAssignmentDirty, isQuestionDirty, markDirty, clearDirty]);
```

## Files That Need Changes

1. ✅ `src/messages/en.json` - Translation keys added
2. ✅ `src/messages/ar.json` - Translation keys added
3. ⏳ `src/features/academics/assignments/builder/pages/AssignmentBuilderPage.tsx` - Major refactor
4. ⏳ `src/components/features/academics/components/curriculum/QuestionEditor.tsx` - Remove auto-save
5. ⏳ `src/features/academics/assignments/builder/components/BuilderHeader.tsx` - Update UI
6. ⏳ `src/features/academics/assignments/builder/components/DesktopLayout.tsx` - Add Save button
7. ⏳ `src/features/academics/assignments/builder/components/MobileLayout.tsx` - Add Save button

## Estimated Effort

- **Phase 1**: 2-3 hours (Core state management)
- **Phase 2**: 1-2 hours (QuestionEditor refactor)
- **Phase 3**: 1-2 hours (UI updates)
- **Phase 4**: 2-3 hours (Testing & polish)
- **Total**: 6-10 hours

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**: Implement in phases, test each phase thoroughly before moving to next

### Risk 2: Complex State Management
**Mitigation**: Use clear naming conventions, add comments, keep draft/saved snapshots separate

### Risk 3: User Confusion (No Auto-Save)
**Mitigation**: Clear visual indicators, prominent save buttons, confirmation dialogs

### Risk 4: Data Loss
**Mitigation**: Global navigation guard, question switching guard, clear "unsaved" warnings

## Testing Strategy

### Unit Tests (Optional)
- Draft state computation
- Dirty state detection
- Validation logic

### Integration Tests
1. Edit assignment → Save → Verify API call
2. Edit question → Save → Verify API call
3. Edit question → Switch → Confirm dialog appears
4. Save & Switch → Persists and navigates
5. Discard & Switch → Discards and navigates
6. Leave page with unsaved → Global guard triggers
7. Publish with unsaved → Blocked or warned

### Manual Testing Checklist
- [ ] Edit assignment title → no API call until Save Assignment
- [ ] Edit assignment description → no API call until Save Assignment
- [ ] Edit question text → no API call until Save Question
- [ ] Edit question points → no API call until Save Question
- [ ] Edit MCQ options → no API call until Save Question
- [ ] Switch questions with unsaved changes → confirmation dialog
- [ ] Save & Switch → persists and navigates
- [ ] Discard & Switch → discards and navigates
- [ ] Leave page with unsaved → global guard triggers
- [ ] Save button disabled when no changes
- [ ] Save button enabled when changes exist
- [ ] Status shows "Unsaved" when dirty
- [ ] Status shows "Saving..." during save
- [ ] Status shows "Saved" after successful save
- [ ] Validation errors prevent save
- [ ] RTL layout works correctly
- [ ] Mobile layout works correctly
- [ ] Read-only mode disables all saves

## Rollback Plan

If issues arise:
1. Revert commits in reverse order
2. Restore auto-save functionality
3. Remove new translation keys (optional)
4. Test that old functionality works

## Success Criteria

✅ No auto-save API calls on typing
✅ Manual save buttons work correctly
✅ Confirmation dialogs prevent data loss
✅ Clear visual feedback on save status
✅ Global navigation guard works
✅ Validation prevents invalid saves
✅ RTL and mobile layouts work
✅ Read-only mode respected
✅ No regressions in existing features

## Recommendation

Given the scope of this refactoring, I recommend:

1. **Review the plan** with the team before proceeding
2. **Create a feature branch** for this work
3. **Implement in phases** as outlined above
4. **Test thoroughly** after each phase
5. **Get code review** before merging
6. **Monitor production** after deployment for any issues

Would you like me to proceed with Phase 1 (Core State Management in AssignmentBuilderPage)?
