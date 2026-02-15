# ERP Data Refactor - Complete

## Summary

Successfully refactored the mock data architecture to separate Admissions data from ERP (Enterprise Resource Planning) data, introducing deterministic seeded randomness and a clean school cycle structure.

## Architecture Overview

### School Cycle Flow

```
Lead → Application → Test → Interview → Decision → Enrollment → Student
                                                         ↓
                                                    Term Data
                                                         ↓
                                              Teacher Assignments
```

## Changes Made

### 1. Created Seeded Random Utility (`src/utils/seeded.ts`)

**Purpose**: Replace `Math.random()` with deterministic seeded randomness to prevent UI values from changing on each reload.

**Functions**:

- `seededNumber(seed, min, max)` - Generate deterministic integer
- `seededFloat(seed, min, max)` - Generate deterministic float
- `seededPick(seed, array)` - Pick deterministic item from array
- `seededNumbers(baseSeed, count, min, max)` - Generate multiple values

**Algorithm**: Uses LCG (Linear Congruential Generator) with string hashing for consistent results.

### 2. Created ERP Type Definitions (`src/types/students/enrollment.ts`)

#### StudentEnrollment

Represents a student's enrollment for a specific academic year.

```typescript
{
  enrollmentId: string; // "ENR-2026-001"
  studentId: string; // Links to Student.id
  academicYear: string; // "2026-2027"
  grade: string; // "Grade 6"
  section: string; // "A", "B", "C"
  enrollmentDate: string; // ISO date
  status: "active" | "completed" | "withdrawn";
}
```

#### EnrollmentTerm

Performance data for a specific term within an enrollment.

```typescript
{
  termId: string;                    // "ENR-2026-001-T1"
  enrollmentId: string;              // Links to enrollment
  term: "Term 1" | "Term 2" | "Term 3";
  startDate: string;
  endDate: string;
  attendancePercentage: number;      // 0-100 (deterministic)
  gradeAverage: number;              // 0-100 (deterministic)
  riskFlags: ("attendance" | "grades" | "behavior")[];
}
```

#### ClassTeacherAssignment

Maps a class (grade + section) to a homeroom teacher.

```typescript
{
  assignmentId: string;
  academicYear: string;
  grade: string;
  section: string;
  teacherId: string;
  teacherName: string;
  teacherNameArabic?: string;
}
```

#### SubjectTeacherAssignment

Maps a class + subject to a subject teacher.

```typescript
{
  assignmentId: string;
  academicYear: string;
  grade: string;
  section: string;
  subject: string;              // "Mathematics", "Science", etc.
  teacherId: string;
  teacherName: string;
  teacherNameArabic?: string;
}
```

### 3. Updated Student Type (`src/types/students/student.ts`)

**Removed ERP Fields** (moved to Enrollment):

- `grade` → Now in `StudentEnrollment.grade`
- `section` → Now in `StudentEnrollment.section`
- `enrollment_year` → Now in `StudentEnrollment.enrollmentDate`
- `academic_year` → Now in `StudentEnrollment.academicYear`
- `term` → Now in `EnrollmentTerm.term`

**Removed Performance Fields** (moved to EnrollmentTerm):

- `attendance_percentage` → Now in `EnrollmentTerm.attendancePercentage`
- `current_average` → Now in `EnrollmentTerm.gradeAverage`
- `risk_flags` → Now in `EnrollmentTerm.riskFlags`

**Kept Fields** (marked as @deprecated for backward compatibility):

- These fields remain optional for existing code but should not be used in new code

**Core Student Fields** (Identity & Admissions):

- `id`, `applicationId`, `leadId`
- `full_name_ar`, `full_name_en`
- `gender`, `dateOfBirth`, `nationality`
- `status`, `gradeRequested`, `source`, `submittedDate`
- `contact` (address, city, district, phone, email)

### 4. Created Mock Enrollments (`src/data/mockEnrollments.ts`)

**Data**: 8 enrollments (one per student) for academic year 2026-2027

- Sections distributed evenly (A, B, C)
- Status based on student status
- Enrollment date from student's submitted date

**Helper Functions**:

- `getEnrollmentByStudentId(studentId)`
- `getEnrollmentsByGrade(grade)`
- `getEnrollmentsBySection(grade, section)`

### 5. Created Mock Terms (`src/data/mockTerms.ts`)

**Data**: 24 term records (3 terms × 8 enrollments)

- Term 1: Sep-Dec 2026
- Term 2: Jan-Mar 2027
- Term 3: Apr-Jun 2027

**Deterministic Performance**:

- Attendance: 85-100% (seeded by `studentId-T1/T2/T3`)
- Grade Average: 70-100% (seeded by `studentId-T1/T2/T3-avg`)
- Risk Flags: Calculated deterministically based on thresholds

**Helper Functions**:

- `getTermsByEnrollmentId(enrollmentId)`
- `getCurrentTerm(enrollmentId)` - Based on current date
- `getLatestTerm(enrollmentId)` - Most recent term
- `getYearToDateAverages(enrollmentId)` - Aggregate across all terms

### 6. Created Mock Teacher Assignments (`src/data/mockTeacherAssignments.ts`)

**Class Teachers**: 15 assignments

- One homeroom teacher per grade-section combination
- Grades 6-10, Sections A-B-C
- Teachers: T001-T015

**Subject Teachers**: Sample assignments

- Multiple teachers per class for different subjects
- Subjects: Mathematics, Science, English, Arabic, Islamic Studies
- Teachers: T101-T109

**Helper Functions**:

- `getClassTeacher(grade, section, year)`
- `getSubjectTeachers(grade, section, year)`
- `getSubjectTeacher(grade, section, subject, year)`

### 7. Refactored Mock Data (`src/data/mockDataLinked.ts`)

**Removed from Student Generation**:

- All `Math.random()` calls
- ERP fields (grade, section, term, academic_year, enrollment_year)
- Performance fields (attendance_percentage, current_average, risk_flags)

**Updated**:

- Medical profiles use `seededPick()` for blood types
- Student notes use `seededNumber()` for count and `seededPick()` for content
- Removed unused `AdmissionsGuardian` import

**Kept**:

- All admissions data (Leads, Applications, Tests, Interviews, Decisions)
- Student identity and contact data
- Guardian linking logic
- Document tracking
- Timeline events

### 8. Updated Exports (`src/data/mockStudents.ts`)

Added re-exports for ERP data:

```typescript
export {
  mockStudentEnrollments,
  getEnrollmentByStudentId,
  // ... enrollment helpers
} from "./mockEnrollments";

export {
  mockEnrollmentTerms,
  getTermsByEnrollmentId,
  // ... term helpers
} from "./mockTerms";

export {
  mockClassTeacherAssignments,
  mockSubjectTeacherAssignments,
  // ... teacher helpers
} from "./mockTeacherAssignments";
```

## Data Integrity

### Linking Keys

- **Student.id** → Primary key for all student data
- **Enrollment.studentId** → Links to Student.id
- **Term.enrollmentId** → Links to Enrollment.enrollmentId
- **Teacher assignments** → Joined by (academicYear, grade, section)

### No Duplicates

- Guardians deduplicated by `national_id` or `guardian.id`
- Guardian links properly maintained via `mockStudentGuardianLinks`

## Benefits

### 1. Deterministic Data

- UI values no longer change on reload
- Consistent test results
- Reproducible bug reports

### 2. Clean Separation

- Admissions data (Lead → Decision) separate from ERP data
- Student identity separate from enrollment/performance data
- Easy to understand data flow

### 3. Scalability

- Easy to add more terms or academic years
- Teacher assignments can be expanded per subject
- Performance data can be queried by term

### 4. Backward Compatibility

- Deprecated fields kept in Student type
- Existing components continue to work
- Gradual migration path

## Migration Guide for Components

### Old Way (Deprecated)

```typescript
const student = getStudentById(id);
const grade = student.grade;
const attendance = student.attendance_percentage;
```

### New Way (Recommended)

```typescript
const student = getStudentById(id);
const enrollment = getEnrollmentByStudentId(student.id);
const currentTerm = getCurrentTerm(enrollment.enrollmentId);

const grade = enrollment.grade;
const attendance = currentTerm.attendancePercentage;
```

## Files Created

1. `src/utils/seeded.ts` - Seeded random utilities
2. `src/types/students/enrollment.ts` - ERP type definitions
3. `src/data/mockEnrollments.ts` - Enrollment mock data
4. `src/data/mockTerms.ts` - Term performance mock data
5. `src/data/mockTeacherAssignments.ts` - Teacher assignment mock data

## Files Modified

1. `src/types/students/student.ts` - Removed ERP fields, marked deprecated
2. `src/types/students/index.ts` - Added enrollment type exports
3. `src/data/mockDataLinked.ts` - Removed ERP fields, added seeded randomness
4. `src/data/mockStudents.ts` - Added ERP data re-exports
5. `src/components/leads/LeadStatusBadge.tsx` - Fixed missing status types

## Testing

Build Status: ✅ Successful

- No TypeScript errors
- All types properly defined
- All data properly linked
- Deterministic values confirmed

## Next Steps

Components should be gradually updated to use the new ERP data structure:

1. Update StudentsList to use enrollment data for grade/section filters
2. Update profile tabs to use term data for performance metrics
3. Update KPI calculations to aggregate from term data
4. Add teacher information to student profiles
5. Create term-based performance reports

## Data Statistics

- **Students**: 8 (3 from admissions + 5 previously enrolled)
- **Enrollments**: 8 (one per student for 2026-2027)
- **Terms**: 24 (3 terms per enrollment)
- **Class Teachers**: 15 (Grades 6-10, Sections A-C)
- **Subject Teachers**: 9 (sample assignments)
- **Guardians**: 13 (G001-G013)
- **Guardian Links**: 11 (student-guardian relationships)
