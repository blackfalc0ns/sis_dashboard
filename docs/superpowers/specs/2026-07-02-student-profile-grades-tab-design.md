# Spec: Wire Student Profile Grades Tab to Real Backend

Wire the **Grades** tab in the student profile to the real backend snapshot API endpoint (`GET /grades/students/:studentId/snapshot?academicYearId=...&termId=...`), replacing mock data and mapping the backend response format to the frontend UI dashboard components.

## Goal
Connect the student profile `GradesTab` component to live backend data by passing active academic year and term context parameters, transforming the backend payload structure to the UI snapshot format, and handling missing context and error states gracefully.

---

## Proposed Changes

### 1. Type Definitions
- **Location**: `src/features/grades/shared/types.ts`
- **Changes**:
  - Add `BackendStudentGradeSnapshotAssessment`, `BackendStudentGradeSnapshotSubject`, and `BackendStudentGradeSnapshot` interfaces representing the raw API payload.
  - Retain existing `StudentGradesSnapshot` and `StudentSubjectGradeSummary` interfaces used by UI components.

### 2. Snapshot Mapper Utility
- **Location**: `src/features/grades/overview/utils/studentGradesSnapshotMapper.ts`
- **Changes**:
  - Create `mapBackendStudentGradeSnapshot(snapshot: BackendStudentGradeSnapshot): StudentGradesSnapshot`.
  - Calculate `currentAverage`, `highestAverage`, `lowestAverage`, and `totalAssessments`.
  - Build `performanceTrend` array for the line chart from assessment percentages and labels.
  - Map individual subjects into `subjectRows` with score movement `trend` (`"up" | "down" | "stable"`).

### 3. Service Layer Update
- **Location**: `src/features/grades/overview/services/gradesOverviewService.ts`
- **Changes**:
  - Update `fetchStudentGradesSnapshot` to require `{ academicYearId?: string; termId: string }`.
  - Pass params to `apiGet<BackendStudentGradeSnapshot>` and transform via `mapBackendStudentGradeSnapshot`.

### 4. Component & Page Updates
- **Locations**:
  - `src/features/students-guardians/students/pages/StudentProfilePage.tsx`
  - `src/features/students-guardians/students/components/StudentTabLoader.tsx`
  - `src/features/students-guardians/students/components/tabs/GradesTab.tsx`
- **Changes**:
  - Pass `yearId` and `termId` from `useStudentsGuardiansYearTermContext()` into `StudentGradesTab`.
  - Update `GradesTabProps` to accept `academicYearId` and `termId`.
  - If `!termId`, render a prompt instructing the user to select an academic year and term.
  - If API fails, render an error message.

### 5. Translations
- **Locations**: `src/messages/en.json` & `src/messages/ar.json`
- **Changes**:
  - Add `missing_term_context` and `loading_error` under student profile grades translations.

---

## Verification Plan

### Automated Tests
- Create unit test `src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts` to test mapper logic against various backend payloads (empty subjects, null final percent, null score, trend calculation).
- Run `npx vitest run src/features/grades` and `npx vitest run src/features/students-guardians`.
- Run `npm run typecheck`.

### Manual Verification
- Navigate to a student profile's Grades tab with a selected academic year and term.
- Confirm real grades, averages, trends, and line chart points render accurately.
- Verify clear prompt appears when no term is selected in the header.
