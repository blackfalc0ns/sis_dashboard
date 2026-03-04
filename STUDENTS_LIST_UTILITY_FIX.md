# StudentsList Utility TypeScript Fix

## Issue
The `studentsListFilters.ts` utility had TypeScript errors because it was using the base `Student` type instead of the extended type that includes enrollment data.

## Root Cause
The `StudentsList` component uses `studentsService.getStudentsWithEnrollment()` which returns students with additional properties:
- `enrollment?: StudentEnrollment`
- `currentTerm?: EnrollmentTerm`
- `ytdPerformance?: { attendance, gradeAverage, riskFlags }`

The utility functions were typed to accept `Student[]` but were trying to access these extended properties, causing TypeScript errors.

## Solution
Created a new `StudentWithEnrollment` type that extends `Student` with the enrollment data properties, and updated all utility functions to use this type.

## Changes Made

### src/utils/students/studentsListFilters.ts
1. Added proper imports for enrollment types
2. Created `StudentWithEnrollment` type definition
3. Updated function signatures:
   - `filterStudentsList()` - now accepts `StudentWithEnrollment[]`
   - `calculateStudentKPIs()` - now accepts `StudentWithEnrollment[]`
   - `extractStudentFilterOptions()` - now accepts `StudentWithEnrollment[]`

## Build Status
✅ All TypeScript errors resolved
✅ Build passes successfully
✅ No new lint errors

## Files Modified
- `src/utils/students/studentsListFilters.ts`
