# Build Errors Summary

## Critical Import Errors to Fix

### 1. Students Service Missing
**Error**: `Module not found: Can't resolve '@/services/studentsService'`
**Files Affected**: 
- All student tabs components
- GuardiansList.tsx
- StudentsList.tsx

**Solution**: The studentsService needs to be moved to the features structure or kept in services folder.

### 2. Admissions Export Utils Wrong Path
**Error**: `Module not found: Can't resolve '@/utils/admissionsExportUtils'`
**Files Affected**:
- ApplicationsList.tsx
- DecisionsList.tsx
- EnrollmentList.tsx
- InterviewsList.tsx
- LeadsList.tsx
- TestsList.tsx
- API routes (exports/analytics, exports/data)

**Solution**: Update imports from `@/utils/admissionsExportUtils` to `@/features/admissions/applications/utils/admissionsExportUtils` or create a shared utils location.

### 3. Curriculum Utils Missing
**Error**: `Module not found: Can't resolve '@/utils/circulum/utils/points'` and `validation`
**Files Affected**:
- useAssignmentMutations.ts
- AttachmentsPanel.tsx
- QuestionOutlineItem.tsx

**Solution**: These curriculum utilities need to be moved to the academics/curriculum feature.

### 4. Missing Admissions Modals
**Error**: `Module not found: Can't resolve '@/features/admissions/components/modals/DocumentViewerModal'`
**Files Affected**:
- DocumentsTab.tsx (students)
- DocumentsCenter.tsx

**Solution**: Update import path to new location in applications/components/modals.

### 5. Student Utils Wrong Path
**Error**: References to `@/features/students-guardians/students/utils/studentUtils`
**Files Affected**:
- Multiple student components

**Solution**: studentUtils needs to be created or moved to the correct location.

## Recommended Fixes

1. **Keep services in src/services/** - Don't move studentsService to features
2. **Create shared utils for admissions exports** - Move to `src/features/admissions/shared/utils/`
3. **Move curriculum utils** - To `src/features/academics/curriculum/utils/`
4. **Update all import paths** - Use find/replace for common patterns
5. **Create missing utility files** - studentUtils, etc.

## Next Steps

1. Fix service imports (keep in src/services)
2. Fix admissions export utils imports
3. Fix curriculum utils imports
4. Fix modal imports
5. Create missing utility files
6. Run build again
