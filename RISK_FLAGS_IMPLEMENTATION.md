# Risk Flags Implementation - Complete

## Summary

Successfully implemented risk flags system for students to identify those requiring additional attention and support.

## Risk Flag Types

Three types of risk flags are now tracked:

1. **Attendance** - Poor attendance record (< 85%)
2. **Grades** - Below-average academic performance (< 70%)
3. **Behavior** - Behavioral issues

## Changes Made

### 1. Type Definitions

**File**: `src/types/students/enums.ts`

- Risk flag types already defined: "attendance", "grades", "behavior"

**File**: `src/types/students/student.ts`

- `risk_flags?: RiskFlag[]` field already in Student interface

### 2. Mock Data Generation

**File**: `src/data/mockStudents.ts`

- Updated student generation to assign realistic risk flags
- Attendance-based: Students with < 85% attendance get "attendance" flag
- Grade-based: Students with < 70% average get "grades" flag
- Behavior-based: ~7% of students get "behavior" flag (every 15th student)
- Realistic attendance rates: 70-100%
- Realistic grade averages: 60-100%

### 3. Utility Functions

**File**: `src/utils/studentUtils.ts`

- `getRiskFlagColor(flag)` - Returns color classes for each flag type
  - Attendance: Orange
  - Grades: Red
  - Behavior: Purple
- `getRiskFlagLabel(flag)` - Returns human-readable labels
  - "Low Attendance", "Low Grades", "Behavior Issues"
- `isStudentAtRisk(student)` - Checks if student has any risk flags

### 4. Visual Display Components

#### StudentsList Component

**File**: `src/components/students-guardians/StudentsList.tsx`

- Risk flags column in data table
- Displays badges for each risk flag
- Color-coded by risk type
- KPI card shows "At Risk" count
- Risk flags included in export data

#### PersonalInfoTab Component

**File**: `src/components/students-guardians/profile-tabs/PersonalInfoTab.tsx`

- Risk flags alert banner at top of form
- Orange warning style with AlertTriangle icon
- Shows all risk flags as badges
- Includes explanatory text

#### OverviewTab Component

**File**: `src/components/students-guardians/profile-tabs/OverviewTab.tsx`

- Risk flags alert at top of overview
- Orange warning style
- Shows risk flag badges with proper labels
- Includes support message

## Risk Flag Distribution (Mock Data)

Based on the implementation:

- ~30% of students have attendance risk (< 85% attendance)
- ~25% of students have grades risk (< 70% average)
- ~7% of students have behavior risk (every 15th student)
- Some students may have multiple risk flags

## Visual Design

- **Attendance Flag**: Orange background, orange text
- **Grades Flag**: Red background, red text
- **Behavior Flag**: Purple background, purple text
- All flags use rounded pill design with proper padding
- Consistent styling across all components

## KPI Integration

The "At Risk" KPI in StudentsList dashboard now accurately counts students with any risk flags, providing quick visibility into students needing attention.

## Future Enhancements

1. Risk flag management UI (add/remove flags manually)
2. Risk flag history tracking
3. Automated interventions based on risk flags
4. Risk flag notifications to guardians/teachers
5. Risk flag analytics and trends
6. Customizable risk thresholds
7. Risk flag resolution workflow

## Files Modified

- `src/data/mockStudents.ts` - Added risk flag generation logic
- `src/components/students-guardians/StudentsList.tsx` - Removed unused import
- `src/components/students-guardians/profile-tabs/PersonalInfoTab.tsx` - Added risk flag alert
- `src/components/students-guardians/profile-tabs/OverviewTab.tsx` - Enhanced risk flag display

## Build Status

✅ Build successful - No errors
✅ TypeScript compilation passed
✅ All routes generated successfully
