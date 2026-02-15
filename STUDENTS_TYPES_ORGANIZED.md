# Student Types Organization - Complete

## Summary

Reorganized the `src/types/students.ts` file with clear structure, sections, and documentation matching the admissions types organization pattern.

## Changes Made

### File Structure

The types file is now organized into clear sections:

1. **ENUMS & STATUS TYPES** - All status and enum types
2. **STUDENT** - Main student entity
3. **STUDENT GUARDIAN** - Guardian information
4. **STUDENT GUARDIAN LINK** - M:N relationship between students and guardians
5. **STUDENT DOCUMENT** - Student documents
6. **STUDENT MEDICAL PROFILE** - Medical information
7. **STUDENT TIMELINE EVENT** - Timeline/history events

### New Type Exports

Added explicit type exports for better type safety:

```typescript
export type StudentStatus = "Active" | "Withdrawn" | "Pending" | "active" | "withdrawn" | "suspended";
export type RiskFlag = "attendance" | "grades" | "behavior";
export type DocumentStatus = "complete" | "missing";
export type TimelineEventType = "application_submitted" | "document_uploaded" | ...;
```

### Organization Benefits

1. **Clear Sections**: Each interface has its own section with header comments
2. **Logical Grouping**: Related types are grouped together
3. **Dependency Order**: Simple types first, complex types last
4. **Better Navigation**: Easy to find specific types
5. **Maintainability**: Clear structure for adding new types
6. **Consistency**: Matches admissions types organization pattern

## Type Hierarchy

```
Enums & Status Types (4 types)
├── StudentStatus
├── RiskFlag
├── DocumentStatus
└── TimelineEventType

Core Interfaces (6 interfaces)
├── StudentMock (main entity)
├── StudentGuardianMock
├── StudentGuardianLinkMock (M:N relationship)
├── StudentDocumentMock
├── StudentMedicalProfileMock
└── StudentTimelineEventMock

Aliases
└── Student (backward compatibility alias for StudentMock)
```

## Type Definitions

### Status Types

#### StudentStatus

```typescript
"Active" | "Withdrawn" | "Pending" | "active" | "withdrawn" | "suspended";
```

Supports both capitalized (new) and lowercase (legacy) values for backward compatibility.

#### RiskFlag

```typescript
"attendance" | "grades" | "behavior";
```

Flags indicating student risk areas.

#### DocumentStatus

```typescript
"complete" | "missing";
```

Status of student documents.

#### TimelineEventType

```typescript
"application_submitted" |
  "document_uploaded" |
  "test_scheduled" |
  "test_completed" |
  "interview_scheduled" |
  "interview_completed" |
  "decision_made";
```

Types of events in student timeline.

### Core Interfaces

#### StudentMock (Main Entity)

The primary student record with three data categories:

**From Admissions Data:**

- Core identification (id, applicationId, leadId)
- Personal information (names, gender, DOB, nationality)
- Status & academic (status, gradeRequested, source)
- Contact information (address, city, district, phone, email)

**Computed/Display Fields (Backward Compatibility):**

- name, student_id, grade, section
- enrollment_year, attendance_percentage, current_average
- risk_flags, created_at, updated_at, date_of_birth

#### StudentGuardianMock

Guardian information with contact details and permissions:

- guardianId, full_name, relation
- phone_primary, phone_secondary, email
- national_id, job_title, workplace
- is_primary, can_pickup, can_receive_notifications

#### StudentGuardianLinkMock

Many-to-many relationship between students and guardians:

- studentId, guardianId
- relation, is_primary

Allows multiple guardians per student and tracks relationship details.

#### StudentDocumentMock

Student documents with upload tracking:

- id (SDOC-\* format), studentId
- type, name, status
- uploadedDate (optional)

#### StudentMedicalProfileMock

Medical information and health records:

- studentId
- medical_conditions, allergies
- notes, emergency_plan

#### StudentTimelineEventMock

Historical events and activity log:

- id, studentId, type
- date, title
- meta (additional event data)

## Data Source

All student data is **derived from admissions data**:

- Primary fields come from `Application` interface
- Computed fields added for backward compatibility
- No manual student data entry required

## Backward Compatibility

### Type Alias

```typescript
export type Student = StudentMock;
```

Allows existing code using `Student` type to continue working.

### Field Aliases

Multiple field aliases for compatibility:

- `name` ↔ `full_name_en`
- `student_id` ↔ `id`
- `grade` ↔ `gradeRequested`
- `date_of_birth` ↔ `dateOfBirth`
- `created_at` ↔ `submittedDate`

### Status Values

Supports both capitalized and lowercase status values:

- New: "Active", "Withdrawn", "Pending"
- Legacy: "active", "withdrawn", "suspended"

## Usage Examples

### Import Specific Types

```typescript
import type {
  Student,
  StudentMock,
  StudentStatus,
  StudentGuardianMock,
  StudentDocumentMock,
  StudentMedicalProfileMock,
  StudentTimelineEventMock,
} from "@/types/students";
```

### Type-Safe Status Checks

```typescript
const status: StudentStatus = "Active";
const riskFlag: RiskFlag = "attendance";
const docStatus: DocumentStatus = "complete";
```

### Interface Usage

```typescript
const student: StudentMock = {
  id: "STU-APP-2024-001",
  applicationId: "APP-2024-001",
  full_name_en: "John Doe",
  full_name_ar: "جون دو",
  status: "Active",
  gradeRequested: "Grade 5",
  // ... other required fields
};
```

### Guardian Relationship

```typescript
const guardian: StudentGuardianMock = {
  guardianId: "G001",
  full_name: "Jane Doe",
  relation: "mother",
  is_primary: true,
  // ... other fields
};

const link: StudentGuardianLinkMock = {
  studentId: "STU-APP-2024-001",
  guardianId: "G001",
  relation: "mother",
  is_primary: true,
};
```

### Timeline Event

```typescript
const event: StudentTimelineEventMock = {
  id: "EVT-APP-2024-001-0",
  studentId: "STU-APP-2024-001",
  type: "application_submitted",
  date: "2026-01-20",
  title: "Application Submitted",
  meta: {
    grade: "Grade 5",
    source: "referral",
  },
};
```

## Relationship with Admissions Types

The student types are designed to work seamlessly with admissions types:

```typescript
import type { Application } from "@/types/admissions";

// Student source references Application source
source?: Application["source"];
```

This ensures type consistency across modules.

## Files Modified

- `src/types/students.ts` - Reorganized with clear sections

## Verification

✅ No TypeScript errors
✅ All existing imports still work
✅ Backward compatibility maintained
✅ Better code organization
✅ Consistent with admissions types structure

## Status

✅ **COMPLETE** - Student types successfully organized
